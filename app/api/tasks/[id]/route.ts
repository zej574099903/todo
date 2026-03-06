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
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (e) {
        return null;
    }
};

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = authenticate();
        if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        const { completed, title, isReminderEnabled, reminderTime } = await request.json();

        await dbConnect();
        const updateData: any = {};
        if (completed !== undefined) updateData.completed = completed;
        if (title) updateData.title = title;
        if (isReminderEnabled !== undefined) updateData.isReminderEnabled = isReminderEnabled;
        if (reminderTime !== undefined) updateData.reminderTime = reminderTime;

        const task = await (Task as any).findOneAndUpdate(
            { _id: params.id, userId: user.userId },
            updateData,
            { new: true }
        );

        if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        return NextResponse.json(task);
    } catch (error: any) {
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = authenticate();
        if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        await dbConnect();

        const task = await (Task as any).findOneAndDelete({ _id: params.id, userId: user.userId });
        if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}
