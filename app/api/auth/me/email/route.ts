import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function PUT(request: Request) {
    try {
        const token = cookies().get('token')?.value;
        if (!token) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const { email } = await request.json();
        if (!email || !/^[\w.\-]+@[\w.\-]+\.\w{2,}$/.test(email)) {
            return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
        }

        await dbConnect();
        await (User as any).findByIdAndUpdate(decoded.userId, { email: email.trim().toLowerCase() });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}
