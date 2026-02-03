// lib/models/interview.ts
// Database models and queries for interviews

import { query, getClient } from '../db';

export interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_location?: string;
  current_job_title?: string;
  years_of_experience?: number;
  linkedin_profile?: string;
  position_applied: string;
  resume_url?: string;
  status: 'registered' | 'in_progress' | 'completed' | 'terminated';
  termination_reason?: string;
  start_time?: Date;
  end_time?: Date;
  completed_questions?: number;
  total_questions?: number;
  suspicion_score?: number;
  video_recording_consent: boolean;
  tab_switch_acknowledgment: boolean;
  facial_recognition_consent: boolean;
  terms_accepted: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface IdentityVerification {
  id?: number;
  interview_id: string;
  reference_photo_url?: string;
  reference_photo_base64?: string;
  face_descriptor: number[];
  verified?: boolean;
  verified_at?: Date;
}

export interface Violation {
  id?: number;
  interview_id: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  question_number?: number;
  timestamp: Date;
  screenshot_url?: string;
  screenshot_base64?: string;
  additional_data?: any;
  action_taken?: string;
}

export interface Answer {
  id?: number;
  interview_id: string;
  question_number: number;
  question_text: string;
  answer_text?: string;
  time_spent?: number;
  answered_at?: Date;
}

// Interview CRUD operations

export async function createInterview(interview: Partial<Interview>): Promise<Interview> {
  const text = `
    INSERT INTO interviews (
      id, candidate_name, candidate_email, candidate_phone, candidate_location,
      current_job_title, years_of_experience, linkedin_profile, position_applied,
      resume_url, status, video_recording_consent, tab_switch_acknowledgment,
      facial_recognition_consent, terms_accepted
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    interview.id,
    interview.candidate_name,
    interview.candidate_email,
    interview.candidate_phone,
    interview.candidate_location,
    interview.current_job_title,
    interview.years_of_experience,
    interview.linkedin_profile,
    interview.position_applied,
    interview.resume_url,
    interview.status || 'registered',
    interview.video_recording_consent,
    interview.tab_switch_acknowledgment,
    interview.facial_recognition_consent,
    interview.terms_accepted,
  ];

  const result = await query(text, values);
  return result.rows[0];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const text = 'SELECT * FROM interviews WHERE id = $1';
  const result = await query(text, [id]);
  return result.rows[0] || null;
}

export async function updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  values.push(id);
  
  const text = `
    UPDATE interviews 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(text, values);
  return result.rows[0];
}

export async function updateInterviewStatus(
  id: string, 
  status: Interview['status'],
  terminationReason?: string
): Promise<Interview> {
  const text = `
    UPDATE interviews 
    SET status = $1, termination_reason = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await query(text, [status, terminationReason, id]);
  return result.rows[0];
}

export async function startInterview(id: string): Promise<Interview> {
  const text = `
    UPDATE interviews 
    SET status = 'in_progress', start_time = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await query(text, [id]);
  return result.rows[0];
}

export async function completeInterview(
  id: string, 
  completedQuestions: number,
  suspicionScore: number
): Promise<Interview> {
  const text = `
    UPDATE interviews 
    SET 
      status = 'completed', 
      end_time = CURRENT_TIMESTAMP,
      completed_questions = $2,
      suspicion_score = $3
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await query(text, [id, completedQuestions, suspicionScore]);
  return result.rows[0];
}

// Identity Verification operations

export async function createIdentityVerification(
  verification: IdentityVerification
): Promise<IdentityVerification> {
  const text = `
    INSERT INTO identity_verifications (
      interview_id, reference_photo_url, reference_photo_base64, 
      face_descriptor, verified
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    verification.interview_id,
    verification.reference_photo_url,
    verification.reference_photo_base64,
    JSON.stringify(verification.face_descriptor),
    verification.verified ?? true,
  ];

  const result = await query(text, values);
  return result.rows[0];
}

export async function getIdentityVerification(
  interviewId: string
): Promise<IdentityVerification | null> {
  const text = 'SELECT * FROM identity_verifications WHERE interview_id = $1';
  const result = await query(text, [interviewId]);
  return result.rows[0] || null;
}

// Violation operations

export async function createViolation(violation: Violation): Promise<Violation> {
  const text = `
    INSERT INTO violations (
      interview_id, violation_type, severity, question_number,
      timestamp, screenshot_url, screenshot_base64, additional_data, action_taken
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    violation.interview_id,
    violation.violation_type,
    violation.severity,
    violation.question_number,
    violation.timestamp,
    violation.screenshot_url,
    violation.screenshot_base64,
    violation.additional_data ? JSON.stringify(violation.additional_data) : null,
    violation.action_taken,
  ];

  const result = await query(text, values);
  return result.rows[0];
}

export async function getViolationsByInterviewId(interviewId: string): Promise<Violation[]> {
  const text = `
    SELECT * FROM violations 
    WHERE interview_id = $1 
    ORDER BY timestamp ASC
  `;
  
  const result = await query(text, [interviewId]);
  return result.rows;
}

export async function getViolationStats(interviewId: string) {
  const text = `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical,
      COUNT(*) FILTER (WHERE severity = 'high') as high,
      COUNT(*) FILTER (WHERE severity = 'medium') as medium,
      COUNT(*) FILTER (WHERE severity = 'low') as low
    FROM violations
    WHERE interview_id = $1
  `;
  
  const result = await query(text, [interviewId]);
  return result.rows[0];
}

// Answer operations

export async function createAnswer(answer: Answer): Promise<Answer> {
  const text = `
    INSERT INTO answers (
      interview_id, question_number, question_text, 
      answer_text, time_spent
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    answer.interview_id,
    answer.question_number,
    answer.question_text,
    answer.answer_text,
    answer.time_spent,
  ];

  const result = await query(text, values);
  return result.rows[0];
}

export async function getAnswersByInterviewId(interviewId: string): Promise<Answer[]> {
  const text = `
    SELECT * FROM answers 
    WHERE interview_id = $1 
    ORDER BY question_number ASC
  `;
  
  const result = await query(text, [interviewId]);
  return result.rows;
}

// Batch operations for efficient data insertion

export async function bulkCreateViolations(violations: Violation[]): Promise<void> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    for (const violation of violations) {
      const text = `
        INSERT INTO violations (
          interview_id, violation_type, severity, question_number,
          timestamp, screenshot_url, screenshot_base64, additional_data, action_taken
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const values = [
        violation.interview_id,
        violation.violation_type,
        violation.severity,
        violation.question_number,
        violation.timestamp,
        violation.screenshot_url,
        violation.screenshot_base64,
        violation.additional_data ? JSON.stringify(violation.additional_data) : null,
        violation.action_taken,
      ];
      
      await client.query(text, values);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function bulkCreateAnswers(answers: Answer[]): Promise<void> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    for (const answer of answers) {
      const text = `
        INSERT INTO answers (
          interview_id, question_number, question_text, 
          answer_text, time_spent
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const values = [
        answer.interview_id,
        answer.question_number,
        answer.question_text,
        answer.answer_text,
        answer.time_spent,
      ];
      
      await client.query(text, values);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Analytics and reporting queries

export async function getInterviewReport(interviewId: string) {
  const interview = await getInterviewById(interviewId);
  const violations = await getViolationsByInterviewId(interviewId);
  const answers = await getAnswersByInterviewId(interviewId);
  const identity = await getIdentityVerification(interviewId);
  const stats = await getViolationStats(interviewId);

  return {
    interview,
    identity,
    violations,
    answers,
    stats,
  };
}

export async function getRecentInterviews(limit: number = 10): Promise<Interview[]> {
  const text = `
    SELECT * FROM interviews 
    ORDER BY created_at DESC 
    LIMIT $1
  `;
  
  const result = await query(text, [limit]);
  return result.rows;
}

export async function getInterviewsByStatus(status: Interview['status']): Promise<Interview[]> {
  const text = 'SELECT * FROM interviews WHERE status = $1 ORDER BY created_at DESC';
  const result = await query(text, [status]);
  return result.rows;
}
