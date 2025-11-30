import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // In Next.js monorepo, process.cwd() returns the workspace root when running from root
    // or apps/web when running from there. We need to handle both cases.
    const cwd = process.cwd();
    
    // Try multiple possible paths based on where the server is running from
    const possiblePaths = [
      // Running from monorepo root (pnpm dev from root)
      path.join(cwd, 'packages', 'contracts', 'festival-config.json'),
      // Running from apps/web
      path.join(cwd, '..', '..', 'packages', 'contracts', 'festival-config.json'),
      // Absolute path fallback
      path.resolve(cwd, '..', 'packages', 'contracts', 'festival-config.json'),
    ];

    console.log('Looking for festival config in:', possiblePaths);
    console.log('Current working directory:', cwd);

    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          console.log('Found config at:', p);
          const config = JSON.parse(fs.readFileSync(p, 'utf-8'));
          return NextResponse.json(config);
        }
      } catch {
        // Continue to next path
      }
    }

    console.log('No festival config found');
    // No config found
    return NextResponse.json(null, { status: 404 });
  } catch (error) {
    console.error('Error reading festival config:', error);
    return NextResponse.json(null, { status: 404 });
  }
}
