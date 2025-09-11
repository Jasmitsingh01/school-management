import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

interface VerifyOTPData {
  email: string;
  otp: string;
}

interface OTPRecord {
  id: number;
  email: string;
  otp_code: string;
  expires_at: string;
  used: boolean;
}

export async function POST(request: Request) {
  try {
    const body: VerifyOTPData = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    const otpRecords = await executeQuery({
      query: `
        SELECT id, email, otp_code, expires_at, used 
        FROM otp_codes 
        WHERE email = ? AND otp_code = ? AND expires_at > NOW() AND used = FALSE
        ORDER BY created_at DESC 
        LIMIT 1
      `,
      values: [email, otp]
    }) as OTPRecord[];

    if (!otpRecords || otpRecords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    const otpRecord = otpRecords[0];

    await executeQuery({
      query: 'UPDATE otp_codes SET used = TRUE WHERE id = ?',
      values: [otpRecord.id] as (string | number)[]
    });

    await executeQuery({
      query: 'UPDATE users SET email_verified = TRUE WHERE email = ?',
      values: [email]
    });

    await executeQuery({
      query: 'DELETE FROM otp_codes WHERE email = ? AND (expires_at < NOW() OR used = TRUE)',
      values: [email]
    });

    return NextResponse.json(
      { 
        message: 'Email verified successfully',
        verified: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}