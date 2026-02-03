import { NextRequest, NextResponse } from 'next/server';
import InterviewModel from '@/lib/models/interview';

export async function GET() {
  try {
    const result = await InterviewModel.createTables();
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      details: result,
    });
  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup database',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Drop all tables first
    await InterviewModel.dropTables();
    
    // Recreate all tables
    const result = await InterviewModel.createTables();
    
    return NextResponse.json({
      success: true,
      message: 'Database reset and recreated successfully',
      details: result,
    });
  } catch (error: any) {
    console.error('Database reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset database',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
