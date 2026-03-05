import { NextResponse } from 'next/server';

export async function GET() {
    const dpKey = process.env.DEEPSEEK_API_KEY;

    if (!dpKey) {
        return NextResponse.json({ error: 'DEEPSEEK_API_KEY not found in env', envKeys: Object.keys(process.env).filter(k => k.includes('DEEP')) });
    }

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
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
                        content: 'Return ONLY a JSON object with no extra text. Format: {"priority":"high","category":"Test","advice":"debug tip"}'
                    },
                    {
                        role: 'user',
                        content: '调试测试任务'
                    }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 100
            }),
            cache: 'no-store'
        });

        const rawText = await response.text();

        return NextResponse.json({
            ok: response.status,
            keyPrefix: dpKey.slice(0, 10) + '...',
            rawResponse: rawText
        });
    } catch (err: any) {
        return NextResponse.json({ fetchError: err?.message });
    }
}
