"use server";

import fs from 'fs/promises';
import path from 'path';

const CONTENT_PATH = path.join(process.cwd(), 'src/data/site-content.json');

export async function getSiteContent() {
  try {
    const data = await fs.readFile(CONTENT_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading site content:', error);
    return { site: {}, brands: [], products: [] };
  }
}

export async function saveSiteContent(content: any) {
  try {
    await fs.writeFile(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving site content:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file uploaded' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    
    // Ensure uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadsDir, filename);
    
    await fs.writeFile(filePath, buffer);
    
    return { 
      success: true, 
      url: `/uploads/${filename}` 
    };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
}

export async function downloadAndUploadImage(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const extension = url.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
    const filename = `${Date.now()}-remote-${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = path.join(uploadsDir, filename);
    
    await fs.writeFile(filePath, buffer);
    
    return { 
      success: true, 
      url: `/uploads/${filename}` 
    };
  } catch (error: any) {
    console.error('Error downloading image:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteImageFile(fileUrl: string) {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return { success: true };
    
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error: any) {
    // If file doesn't exist, we consider it success
    console.warn('Error deleting file:', error);
    return { success: true };
  }
}
