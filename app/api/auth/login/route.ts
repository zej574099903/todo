import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'REQUIRED' }, { status: 400 });
        }

        try {
            await dbConnect();
        } catch (dbErr) {
            console.error('DB Connection Error:', dbErr);
            return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
        }

        // Find User
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
        }

        // Create JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const response = NextResponse.json({
            message: 'Logged in successfully',
            user: { id: user._id, username: user.username }
        });

        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60
        });

        return response;

    } catch (error: any) {
        console.error('Login Route Error:', error);
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}
