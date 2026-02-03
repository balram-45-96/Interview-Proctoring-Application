import pool from '../db';

export interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  position_applied: string;
  years_of_experience: number;
  resume_url: string;
  status: 'registered' | 'in_progress' | 'completed' | 'terminated';
  suspicion_score: number;
  start_time?: Date;
  end_time?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IdentityVerification {
  id: number;
  interview_id: string;
  reference_photo_base64: string;
  face_descriptor: number[];
  verified_at: Date;
}

export interface Violation {
  id: number;
  interview_id: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  timestamp: Date;
  question_number?: number;
}

export interface Answer {
  id: number;
  interview_id: string;
  question_number: number;
  question_text: string;
  answer_text: string;
  time_spent: number;
  answered_at: Date;
}

export const InterviewModel = {
  async createTables() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create interviews table
      await client.query(`
        CREATE TABLE IF NOT EXISTS interviews (
          id VARCHAR(50) PRIMARY KEY,
          candidate_name VARCHAR(255) NOT NULL,
          candidate_email VARCHAR(255) NOT NULL,
          candidate_phone VARCHAR(20) NOT NULL,
          position_applied VARCHAR(255) NOT NULL,
          years_of_experience INTEGER NOT NULL,
          resume_url TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'in_progress', 'completed', 'terminated')),
          suspicion_score INTEGER DEFAULT 0 CHECK (suspicion_score >= 0 AND suspicion_score <= 100),
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          consents JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create identity_verifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS identity_verifications (
          id SERIAL PRIMARY KEY,
          interview_id VARCHAR(50) REFERENCES interviews(id) ON DELETE CASCADE,
          reference_photo_base64 TEXT NOT NULL,
          face_descriptor JSONB NOT NULL,
          verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create violations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS violations (
          id SERIAL PRIMARY KEY,
          interview_id VARCHAR(50) REFERENCES interviews(id) ON DELETE CASCADE,
          violation_type VARCHAR(100) NOT NULL,
          severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          description TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          question_number INTEGER
        )
      `);

      // Create answers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS answers (
          id SERIAL PRIMARY KEY,
          interview_id VARCHAR(50) REFERENCES interviews(id) ON DELETE CASCADE,
          question_number INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          answer_text TEXT NOT NULL,
          time_spent INTEGER NOT NULL,
          answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_interviews_email ON interviews(candidate_email);
        CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
        CREATE INDEX IF NOT EXISTS idx_violations_interview ON violations(interview_id);
        CREATE INDEX IF NOT EXISTS idx_answers_interview ON answers(interview_id);
      `);

      await client.query('COMMIT');
      return { success: true, message: 'All tables created successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async dropTables() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DROP TABLE IF EXISTS answers CASCADE');
      await client.query('DROP TABLE IF EXISTS violations CASCADE');
      await client.query('DROP TABLE IF EXISTS identity_verifications CASCADE');
      await client.query('DROP TABLE IF EXISTS interviews CASCADE');
      await client.query('COMMIT');
      return { success: true, message: 'All tables dropped successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async createInterview(data: {
    fullName: string;
    email: string;
    phone: string;
    position: string;
    experience: number;
    resumeUrl: string;
    consents: any;
  }): Promise<Interview> {
    const id = `INT-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO interviews 
       (id, candidate_name, candidate_email, candidate_phone, position_applied, 
        years_of_experience, resume_url, consents, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        id,
        data.fullName,
        data.email,
        data.phone,
        data.position,
        data.experience,
        data.resumeUrl,
        JSON.stringify(data.consents),
        'registered',
      ]
    );
    return result.rows[0];
  },

  async saveIdentityVerification(data: {
    interviewId: string;
    referencePhoto: string;
    faceDescriptor: number[];
  }): Promise<IdentityVerification> {
    const result = await pool.query(
      `INSERT INTO identity_verifications 
       (interview_id, reference_photo_base64, face_descriptor) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [data.interviewId, data.referencePhoto, JSON.stringify(data.faceDescriptor)]
    );
    return result.rows[0];
  },

  async updateInterviewStatus(
    interviewId: string,
    status: string,
    additionalData?: any
  ) {
    let query = 'UPDATE interviews SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status];
    let paramIndex = 2;

    if (additionalData?.startTime) {
      query += `, start_time = $${paramIndex}`;
      params.push(additionalData.startTime);
      paramIndex++;
    }

    if (additionalData?.endTime) {
      query += `, end_time = $${paramIndex}`;
      params.push(additionalData.endTime);
      paramIndex++;
    }

    if (additionalData?.suspicionScore !== undefined) {
      query += `, suspicion_score = $${paramIndex}`;
      params.push(additionalData.suspicionScore);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(interviewId);

    const result = await pool.query(query, params);
    return result.rows[0];
  },

  async saveAnswer(data: {
    interviewId: string;
    questionNumber: number;
    questionText: string;
    answerText: string;
    timeSpent: number;
  }): Promise<Answer> {
    const result = await pool.query(
      `INSERT INTO answers 
       (interview_id, question_number, question_text, answer_text, time_spent) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        data.interviewId,
        data.questionNumber,
        data.questionText,
        data.answerText,
        data.timeSpent,
      ]
    );
    return result.rows[0];
  },

  async saveViolation(data: {
    interviewId: string;
    violationType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
    questionNumber?: number;
  }): Promise<Violation> {
    const result = await pool.query(
      `INSERT INTO violations 
       (interview_id, violation_type, severity, description, question_number) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        data.interviewId,
        data.violationType,
        data.severity,
        data.description || null,
        data.questionNumber || null,
      ]
    );
    return result.rows[0];
  },

  async getInterview(interviewId: string): Promise<Interview | null> {
    const result = await pool.query('SELECT * FROM interviews WHERE id = $1', [
      interviewId,
    ]);
    return result.rows[0] || null;
  },

  async getInterviewWithDetails(interviewId: string) {
    const interview = await this.getInterview(interviewId);
    if (!interview) return null;

    const [violations, answers, identity] = await Promise.all([
      pool.query('SELECT * FROM violations WHERE interview_id = $1 ORDER BY timestamp', [
        interviewId,
      ]),
      pool.query(
        'SELECT * FROM answers WHERE interview_id = $1 ORDER BY question_number',
        [interviewId]
      ),
      pool.query('SELECT * FROM identity_verifications WHERE interview_id = $1', [
        interviewId,
      ]),
    ]);

    return {
      interview,
      violations: violations.rows,
      answers: answers.rows,
      identity: identity.rows[0] || null,
    };
  },
};

export default InterviewModel;
