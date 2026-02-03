import { NextRequest, NextResponse } from 'next/server';
import InterviewModel from '@/lib/models/interview';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const yearsOfExperience = parseInt(formData.get('yearsOfExperience') as string);
    const positionAppliedFor = formData.get('positionAppliedFor') as string;
    const consentsStr = formData.get('consents') as string;
    const resumeFile = formData.get('resume') as File;

    // Validation
    if (!fullName || !email || !phone || !positionAppliedFor || !resumeFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save resume file
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'resumes');
    const fileName = `${Date.now()}-${resumeFile.name}`;
    const filePath = join(uploadDir, fileName);
    
    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    await writeFile(filePath, buffer);
    const resumeUrl = `/uploads/resumes/${fileName}`;

    // Parse consents
    const consents = consentsStr ? JSON.parse(consentsStr) : {};

    // Create interview record
    const interview = await InterviewModel.createInterview({
      fullName,
      email,
      phone,
      position: positionAppliedFor,
      experience: yearsOfExperience,
      resumeUrl,
      consents,
    });

    return NextResponse.json({
      success: true,
      interview,
      message: 'Interview registered successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Failed to register interview',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
