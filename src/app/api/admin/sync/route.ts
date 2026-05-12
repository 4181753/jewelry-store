import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
  try {
    // 1. Add all changes (especially site-content.json)
    try {
      await execPromise('git add .');
    } catch (err: any) {
      // Fallback for environment issues: try to use full path if simple 'git' fails
      // This is a common issue in some Windows environments
      await execPromise('C:\\Users\\41817\\AppData\\Roaming\\Accio\\pre-install\\906b605a3eb4\\git\\cmd\\git.exe add .');
    }
    
    // 2. Commit with timestamp
    const timestamp = new Date().toLocaleString();
    try {
      await execPromise(`git commit -m "Admin Update: ${timestamp}"`);
    } catch (err: any) {
      if (!err.message.includes('nothing to commit')) throw err;
    }
    
    // 3. Push to GitHub (triggers GitHub Actions)
    try {
      await execPromise('git push origin main');
    } catch (err: any) {
      await execPromise('C:\\Users\\41817\\AppData\\Roaming\\Accio\\pre-install\\906b605a3eb4\\git\\cmd\\git.exe push origin main');
    }
    
    return NextResponse.json({ success: true, message: 'Successfully synced to GitHub and triggered deployment.' });
  } catch (error: any) {
    console.error('Sync Error:', error);
    
    // If no changes to commit, still return success but with a different message
    if (error.message.includes('nothing to commit')) {
      return NextResponse.json({ success: true, message: 'Already up to date. Nothing to sync.' });
    }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
