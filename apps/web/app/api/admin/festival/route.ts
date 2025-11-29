import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch from DB/blockchain
  // Return 404 if no festival exists
  
  // Mock: return null for now (no festival deployed)
  return NextResponse.json(null, { status: 404 });
}
