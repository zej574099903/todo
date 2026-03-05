import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
    try {
        const { username, email, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'REQUIRED' }, { status: 400 });
        }

        try {
            await dbConnect();
        } catch (dbErr) {
            console.error('DB Connection Error:', dbErr);
            return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return NextResponse.json({ error: 'ALREADY_EXISTS' }, { status: 409 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            username,
            email: email || undefined,
            password: hashedPassword,
        });

        return NextResponse.json({
            message: 'User registered successfully',
            user: { id: newUser._id, username: newUser.username }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Route Error:', error);
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}
