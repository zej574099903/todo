import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authenticate = () => {
    const token = cookies().get('token')?.value;
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    } catch {
        return null;
    }
};

export async function GET() {
    try {
        const user = authenticate();
        if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        await dbConnect();
        const tasks = await (Task as any).find({ userId: user.userId }).sort({ createdAt: -1 });
        return NextResponse.json(tasks);
    } catch {
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = authenticate();
        if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        const { title, category: reqCategory, priority: reqPriority, dueDate } = await request.json();
        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'REQUIRED' }, { status: 400 });
        }

        // Use NLP extracted values if they exist, otherwise fallback
        let priority = reqPriority || 'none';
        let category = reqCategory || 'Uncategorized';
        let aiAdvice = '';

        await dbConnect();
        const task = await (Task as any).create({
            userId: user.userId,
            title: title.trim(),
            completed: false,
            priority,
            category,
            dueDate: dueDate || null,
            aiAdvice
        });

        // Run DeepSeek AI asynchronously in the background so it doesn't block the UI
        const dpKey = process.env.DEEPSEEK_API_KEY;
        if (dpKey) {
            (async () => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

                    const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${dpKey}`
                        },
                        body: JSON.stringify({
                            model: 'deepseek-chat',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a task analyzer. Return ONLY a raw JSON object. Format: {"priority":"high","category":"简短的中文分类名","advice":"一句简短的中文执行建议"}. Priority MUST be one of: high, medium, low, none. Category and advice MUST be in Chinese.'
                                },
                                {
                                    role: 'user',
                                    content: title.trim()
                                }
                            ],
                            response_format: { type: 'json_object' },
                            temperature: 0.3,
                            max_tokens: 200
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (aiResponse.ok) {
                        const aiData = await aiResponse.json();
                        const rawContent: string = aiData?.choices?.[0]?.message?.content || '';

                        try {
                            const clean = rawContent.replace(/```(?:json)?\n?/g, '').trim();
                            const parsed = JSON.parse(clean);

                            const validPriorities = ['high', 'medium', 'low', 'none'];
                            const finalPriority = validPriorities.includes(parsed.priority) ? parsed.priority : 'none';
                            const finalCategory = (parsed.category as string)?.slice(0, 50) || 'Uncategorized';
                            const finalAdvice = (parsed.advice as string)?.slice(0, 500) || '';

                            // Reconnect inside async background context
                            await dbConnect();
                            await (Task as any).findByIdAndUpdate(task._id, {
                                priority: finalPriority,
                                category: finalCategory,
                                aiAdvice: finalAdvice
                            });
                            console.log('[Background AI] Task updated successfully:', task._id);
                        } catch (parseErr) {
                            console.error('[Background AI] Parse failed:', parseErr);
                        }
                    } else {
                        console.error('[Background AI] API Error:', aiResponse.status);
                    }
                } catch (err: any) {
                    console.error('[Background AI] Fetch Error:', err?.message);
                }
            })();
        }

        // Return 201 Created INSTANTLY
        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}
