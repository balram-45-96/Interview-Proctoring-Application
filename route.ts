// app/api/setup/database/route.ts
// Next.js API Route for Database Setup

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const schema = `
-- Drop existing tables if they exist
DROP TABLE IF EXISTS violations CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS identity_verifications CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;

-- Create interviews table
CREATE TABLE interviews (
    id VARCHAR(255) PRIMARY KEY,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_phone VARCHAR(50),
    candidate_location VARCHAR(255),
    current_job_title VARCHAR(255),
    years_of_experience INTEGER,
    linkedin_profile TEXT,
    position_applied VARCHAR(255) NOT NULL,
    resume_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'registered',
    termination_reason VARCHAR(100),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    completed_questions INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 10,
    suspicion_score INTEGER DEFAULT 0,
    video_recording_consent BOOLEAN DEFAULT false,
    tab_switch_acknowledgment BOOLEAN DEFAULT false,
    facial_recognition_consent BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create identity_verifications table
CREATE TABLE identity_verifications (
    id SERIAL PRIMARY KEY,
    interview_id VARCHAR(255) REFERENCES interviews(id) ON DELETE CASCADE,
    reference_photo_url TEXT,
    reference_photo_base64 TEXT,
    face_descriptor JSONB,
    verified BOOLEAN DEFAULT true,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create violations table
CREATE TABLE violations (
    id SERIAL PRIMARY KEY,
    interview_id VARCHAR(255) REFERENCES interviews(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    question_number INTEGER,
    timestamp TIMESTAMP NOT NULL,
    screenshot_url TEXT,
    screenshot_base64 TEXT,
    additional_data JSONB,
    action_taken VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create answers table
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    interview_id VARCHAR(255) REFERENCES interviews(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    time_spent INTEGER,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_interviews_email ON interviews(candidate_email);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_created_at ON interviews(created_at);
CREATE INDEX idx_violations_interview_id ON violations(interview_id);
CREATE INDEX idx_violations_type ON violations(violation_type);
CREATE INDEX idx_violations_severity ON violations(severity);
CREATE INDEX idx_answers_interview_id ON answers(interview_id);
CREATE INDEX idx_identity_interview_id ON identity_verifications(interview_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for interviews table
CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
`;

export async function GET() {
  let pool: Pool | null = null;

  try {
    // Database configuration from environment variables or defaults
    const dbConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'testing',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    };

    pool = new Pool(dbConfig);

    console.log('🔌 Connecting to PostgreSQL...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const client = await pool.connect();
    
    try {
      console.log('📋 Creating database schema...');
      
      // Split schema by semicolons and execute each statement
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await client.query(statement);
        } catch (err: any) {
          // Log but don't fail on warnings
          console.warn('Statement warning:', err.message);
        }
      }

      console.log('✅ Schema created successfully');

      // Get table list
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

      const tables = tablesResult.rows.map(row => row.tablename);

      client.release();

      return NextResponse.json({
        success: true,
        message: 'Database setup completed successfully',
        config: {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
        },
        tables: tables,
        connectionString: `postgresql://${dbConfig.user}:****@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
      });

    } catch (error: any) {
      client.release();
      throw error;
    }

  } catch (error: any) {
    console.error('❌ Database setup error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        help: [
          'Make sure PostgreSQL is installed and running',
          'Verify database credentials in .env.local',
          'Check if the database exists: psql -U postgres -l',
          'Create database if needed: createdb -U postgres testing',
        ],
      },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// POST endpoint to reset database
export async function POST() {
  let pool: Pool | null = null;

  try {
    const dbConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'testing',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    };

    pool = new Pool(dbConfig);
    const client = await pool.connect();

    try {
      console.log('🗑️ Dropping existing tables...');
      
      await client.query('DROP TABLE IF EXISTS violations CASCADE');
      await client.query('DROP TABLE IF EXISTS answers CASCADE');
      await client.query('DROP TABLE IF EXISTS identity_verifications CASCADE');
      await client.query('DROP TABLE IF EXISTS interviews CASCADE');
      
      console.log('📋 Creating fresh schema...');
      
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await client.query(statement);
        } catch (err: any) {
          console.warn('Statement warning:', err.message);
        }
      }

      client.release();

      return NextResponse.json({
        success: true,
        message: 'Database reset completed successfully',
      });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
