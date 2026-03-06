import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';

// This route is called by Vercel Cron (or manually by a test call)
// It finds all tasks with dueDate within the next hour that haven't had a reminder sent yet

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.REMINDER_EMAIL_FROM || 'noreply@todo.zhouanjun.top';
const CRON_SECRET = process.env.CRON_SECRET || 'dev_cron_secret';

export async function GET(request: Request) {
    // Security check - only allow requests with the correct secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (secret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Find tasks: has a dueDate, not completed, no reminder sent yet, due within 1 hour
    const tasks = await (Task as any).find({
        dueDate: { $gte: now, $lte: oneHourLater },
        completed: false,
        reminderSentAt: null,
    });

    const results: string[] = [];

    for (const task of tasks) {
        try {
            // Fetch the user associated with this task
            const user = await (User as any).findById(task.userId);
            if (!user || !user.email) {
                results.push(`[SKIP] Task "${task.title}" - user has no email`);
                continue;
            }

            // Format due date nicely
            const dueDateStr = new Date(task.dueDate).toLocaleString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
                timeZone: 'Asia/Shanghai'
            });

            const priorityLabel: Record<string, string> = { high: '🔥 高优先级', medium: '⚡ 中优先级', low: '📌 低优先级', none: '' };
            const priorityTag = priorityLabel[task.priority] || '';

            // Send reminder email using Resend
            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: `⏰ 任务提醒：${task.title}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fffaf5; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
                        <!-- Header Banner -->
                        <div style="background: linear-gradient(135deg, #ff9f43 0%, #ff6b81 100%); padding: 32px 40px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 8px;">⏰</div>
                            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">任务即将到期提醒</h1>
                        </div>
                        <!-- Content -->
                        <div style="padding: 32px 40px;">
                            <p style="color: #636e72; font-size: 15px; margin-top: 0;">
                                Hi <strong style="color: #2d3436;">${user.username}</strong>，您有一个即将到期的任务：
                            </p>
                            <!-- Task Card -->
                            <div style="background: white; border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(255, 159, 67, 0.2); margin: 20px 0;">
                                <div style="font-size: 18px; font-weight: 700; color: #2d3436; margin-bottom: 8px;">${task.title}</div>
                                ${priorityTag ? `<div style="font-size: 13px; font-weight: 600; color: #ff9f43; margin-bottom: 6px;">${priorityTag}</div>` : ''}
                                ${task.category !== 'Uncategorized' ? `<div style="font-size: 13px; color: #636e72;">🏷️ ${task.category}</div>` : ''}
                                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; color: #e17055; font-weight: 600; font-size: 14px;">
                                    📅 到期时间：${dueDateStr}
                                </div>
                            </div>
                            ${task.aiAdvice ? `<div style="background: rgba(116,185,255,0.1); border-left: 3px solid #74b9ff; padding: 12px 16px; border-radius: 0 12px 12px 0; font-size: 13px; color: #0984e3; margin-top: 16px;">✨ AI 建议：${task.aiAdvice}</div>` : ''}
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tasks" 
                               style="display: block; text-align: center; margin-top: 28px; background: linear-gradient(135deg, #ff9f43, #ff6b81); color: white; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 15px;">
                                🚀 立即处理任务
                            </a>
                        </div>
                        <!-- Footer -->
                        <div style="padding: 20px 40px; text-align: center; border-top: 1px solid #f0f0f0;">
                            <p style="color: #b2bec3; font-size: 12px; margin: 0;">
                                此提醒由 Todo App 自动发送 · 您可以在设置中关闭提醒邮件
                            </p>
                        </div>
                    </div>
                `
            });

            // Mark reminder as sent
            await (Task as any).findByIdAndUpdate(task._id, { reminderSentAt: now });
            results.push(`[OK] Sent reminder to ${user.email} for task "${task.title}"`);
        } catch (err: any) {
            results.push(`[ERROR] Task "${task.title}": ${err.message}`);
        }
    }

    return NextResponse.json({
        processed: tasks.length,
        results
    });
}
