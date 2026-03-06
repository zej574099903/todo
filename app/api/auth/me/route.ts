import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET() {
    try {
        const token = cookies().get('token')?.value;
        if (!token) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, username: string };

        await dbConnect();
        const user = await (User as any).findById(decoded.userId);
        if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        return NextResponse.json({ user: { id: user._id, username: user.username, email: user.email || '' } });
    } catch (error) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
}
