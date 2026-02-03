import { NextRequest, NextResponse } from 'next/server';
import InterviewModel from '@/lib/models/interview';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewId, referencePhoto, faceDescriptor } = body;

    // Validation
    if (!interviewId || !referencePhoto || !faceDescriptor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json(
        { error: 'Invalid face descriptor format' },
        { status: 400 }
      );
    }

    // Verify interview exists
    const interview = await InterviewModel.getInterview(interviewId);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Save identity verification
    const verification = await InterviewModel.saveIdentityVerification({
      interviewId,
      referencePhoto,
      faceDescriptor,
    });

    // Update interview status
    await InterviewModel.updateInterviewStatus(interviewId, 'in_progress', {
      startTime: new Date(),
    });

    return NextResponse.json({
      success: true,
      verification,
      message: 'Identity verified successfully',
    });
  } catch (error: any) {
    console.error('Identity verification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify identity',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
