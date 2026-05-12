import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Absolute path to git for Windows environments where PATH might be missing
const GIT_PATH = 'C:\\Users\\41817\\AppData\\Roaming\\Accio\\pre-install\\906b605a3eb4\\git\\cmd\\git.exe';

async function runGit(command: string) {
  try {
    // Try standard git first
    return await execPromise(`git ${command}`);
  } catch (err: any) {
    // If not found, try absolute path
    return await execPromise(`"${GIT_PATH}" ${command}`);
  }
}

export async function POST() {
  try {
    // 1. Add all changes (especially site-content.json)
    await runGit('add .');
    
    // 2. Commit with timestamp
    const timestamp = new Date().toLocaleString();
    try {
      await runGit(`commit -m "Admin Update: ${timestamp}"`);
    } catch (err: any) {
      // If nothing to commit, we can continue to push. 
      // Checking for common "nothing to commit" indicators in different locales/formats
      const isNothingToCommit = 
        err.message.includes('nothing to commit') || 
        err.message.includes('无提交内容') || 
        err.message.includes('clean') ||
        err.stdout?.includes('nothing to commit') ||
        err.stdout?.includes('clean');
        
      if (!isNothingToCommit) throw err;
    }
    
    // 3. Push to GitHub (triggers GitHub Actions)
    await runGit('push origin main');
    
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
