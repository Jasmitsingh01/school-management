import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
export async function sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'School Management System'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .otp-code {
              background: #007bff;
              color: white;
              font-size: 32px;
              font-weight: bold;
              padding: 15px 30px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
              letter-spacing: 5px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 School Management System</h1>
              <h2>Email Verification Required</h2>
            </div>
            
            <p>Hello ${name || 'User'},</p>
            
            <p>Thank you for registering with our School Management System. To complete your registration, please verify your email address using the OTP code below:</p>
            
            <div class="otp-code">
              ${otp}
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This OTP code will expire in <strong>10 minutes</strong></li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this verification, please ignore this email</li>
              </ul>
            </div>
            
            <p>Once verified, you'll be able to access all features of our platform including adding and managing school information.</p>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; 2024 School Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        School Management System - Email Verification
        
        Hello ${name || 'User'},
        
        Thank you for registering with our School Management System. To complete your registration, please verify your email address using the OTP code below:
        
        OTP Code: ${otp}
        
        Important:
        - This OTP code will expire in 10 minutes
        - Do not share this code with anyone
        - If you didn't request this verification, please ignore this email
        
        Once verified, you'll be able to access all features of our platform.
        
        This is an automated email. Please do not reply to this message.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}