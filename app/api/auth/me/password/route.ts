import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function PUT(request: Request) {
    try {
        const token = cookies().get('token')?.value;
        if (!token) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        } catch {
            return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
        }

        await dbConnect();
        const user = await (User as any).findById(decoded.userId).select('+password');

        if (!user) {
            return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'INCORRECT_PASSWORD' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return NextResponse.json({ success: true, message: 'PASSWORD_UPDATED' }, { status: 200 });

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}
