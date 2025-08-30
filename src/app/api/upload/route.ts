import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { UploadResponse } from '@/types';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded', success: false },
        { status: 400 }
      );
    }

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`;

    // Upload to Vercel Blob
    const blob = await put(`schoolImages/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false, // We're already adding our own suffix
    });

    const response: UploadResponse = {
      message: 'File uploaded successfully',
      filePath: blob.url, // This is the public URL
      success: true
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', success: false },
      { status: 500 }
    );
  }
}
