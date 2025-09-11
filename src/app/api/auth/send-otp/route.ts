import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateOTP, sendOTPEmail } from '@/lib/email';

interface SendOTPData {
  email: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const body: SendOTPData = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await executeQuery({
      query: `DELETE FROM otp_codes WHERE email = ? AND (expires_at < NOW() OR used = TRUE)`,
      values: [email]
    });

    await executeQuery({
      query: `INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)`,
      values: [email, otp, expiresAt] as (string | number)[]
    });

    const emailSent = await sendOTPEmail(email, otp, name);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'OTP sent successfully',
        email: email,
        expiresIn: 600
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}