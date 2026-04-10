import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get file extension from mime type
const getFileExtension = (mimeType) => {
  const mimeToExt = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeToExt[mimeType] || 'bin';
};

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo');
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get file extension from content type or use a default
    const fileExt = getFileExtension(file.type);
    const filename = `${uuidv4()}.${fileExt}`;
    
    // Define upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, filename);
    
    try {
      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });
      
      // Write the file
      await writeFile(filePath, buffer);
      
      // Return the file URL
      const fileUrl = `/uploads/${filename}`;
      return NextResponse.json({ 
        success: true,
        url: fileUrl 
      });
      
    } catch (error) {
      console.error('File system error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save file to server' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Server error during file upload' 
      },
      { status: 500 }
    );
  }
}
