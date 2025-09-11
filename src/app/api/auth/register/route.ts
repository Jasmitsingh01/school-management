import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateOTP, sendOTPEmail } from '@/lib/email';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface QueryResult {
  insertId: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const body: RegisterData = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' 
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const existingUsers = await executeQuery({
      query: `SELECT id FROM users WHERE email = ?`,
      values: [email]
    }) as Array<{ id: number }>;

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await executeQuery({
      query: `INSERT INTO users (name, email, password, email_verified) VALUES (?, ?, ?, FALSE)`,
      values: [name, email, hashedPassword]
    }) as QueryResult;

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await executeQuery({
      query: `INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)`,
      values: [email, otp, expiresAt]
    });

    const emailSent = await sendOTPEmail(email, otp, name);

    if (!emailSent) {
      return NextResponse.json(
        { 
          message: 'Registration successful, but verification email failed to send. Please request a new OTP.',
          requiresVerification: true,
          email: email
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Registration successful. Please check your email for verification code.',
        requiresVerification: true,
        email: email,
        expiresIn: 600
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}