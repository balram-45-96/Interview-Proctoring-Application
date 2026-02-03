import { NextRequest, NextResponse } from 'next/server';
import InterviewModel from '@/lib/models/interview';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewId, status, answers, violations } = body;

    // Validation
    if (!interviewId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Calculate suspicion score based on violations
    let suspicionScore = 0;
    if (violations && Array.isArray(violations)) {
      for (const violation of violations) {
        // Save each violation
        await InterviewModel.saveViolation({
          interviewId,
          violationType: violation.type,
          severity: violation.severity,
          description: violation.description,
          questionNumber: violation.questionNumber,
        });

        // Add to suspicion score
        const severityScores: Record<string, number> = {
          low: 5,
          medium: 15,
          high: 30,
          critical: 50,
        };
        suspicionScore += severityScores[violation.severity] || 0;
      }
    }

    // Cap suspicion score at 100
    suspicionScore = Math.min(suspicionScore, 100);

    // Save all answers
    if (answers && Array.isArray(answers)) {
      for (const answer of answers) {
        await InterviewModel.saveAnswer({
          interviewId,
          questionNumber: answer.questionNumber,
          questionText: answer.questionText,
          answerText: answer.answerText,
          timeSpent: answer.timeSpent,
        });
      }
    }

    // Update interview status
    const updatedInterview = await InterviewModel.updateInterviewStatus(
      interviewId,
      status,
      {
        endTime: new Date(),
        suspicionScore,
      }
    );

    // Get complete interview details
    const interviewDetails = await InterviewModel.getInterviewWithDetails(interviewId);

    return NextResponse.json({
      success: true,
      interview: updatedInterview,
      details: interviewDetails,
      message: `Interview ${status} successfully`,
    });
  } catch (error: any) {
    console.error('Interview submission error:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit interview',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
