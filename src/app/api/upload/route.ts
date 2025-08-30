import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'schoolImages');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error: unknown) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const response: UploadResponse = {
      message: 'File uploaded successfully',
      filePath: `/schoolImages/${filename}`,
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