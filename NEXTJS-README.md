# Interview Proctoring Application - Next.js Complete Solution

A **100% Next.js** interview proctoring system with PostgreSQL integration, real-time face detection, and comprehensive violation monitoring.

## 🎯 Features

- ✅ **User Information Collection** - Forms with validation
- ✅ **Resume Upload** - PDF/DOC/DOCX support  
- ✅ **Identity Verification** - Face capture before interview
- ✅ **10 Interview Questions** - Timed with answer collection
- ✅ **Real-time Face Detection** - Background monitoring
- ✅ **Continuous Face Verification** - Match throughout interview
- ✅ **Tab/Window Switch Detection** - Auto-terminate on violation
- ✅ **PostgreSQL Database** - Complete data persistence
- ✅ **Violation Logging** - Detailed tracking with timestamps
- ✅ **Web-based Database Setup** - No command line needed!

## 📋 Prerequisites

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### 2. Install Node.js 18+

Download from: https://nodejs.org/

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd interview-proctoring-app
npm install
```

This installs:
- Next.js 14
- React 18
- PostgreSQL client (pg)
- Lucide icons
- face-api.js
- TypeScript

### Step 2: Create PostgreSQL Database

```bash
# Open PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE testing;

# Exit
\q
```

Alternatively:
```bash
createdb -U postgres testing
```

### Step 3: Start Next.js Development Server

```bash
npm run dev
```

App runs at: **http://localhost:3000**

## 🔧 Database Setup (Web UI - No Terminal Needed!)

### Option 1: Web-based Setup (Easiest)

1. Start your Next.js server: `npm run dev`
2. Visit: **http://localhost:3000/setup**
3. Click **"Setup Database"** button
4. Done! ✅

The web interface will:
- Create all 4 tables (interviews, violations, answers, identity_verifications)
- Set up indexes and foreign keys
- Configure triggers
- Show you the results

### Option 2: API Endpoint

You can also hit the API directly:

```bash
# Setup database
curl http://localhost:3000/api/setup/database

# Reset database (deletes all data)
curl -X POST http://localhost:3000/api/setup/database
```

## 📁 Project Structure

```
interview-proctoring-app/
├── app/
│   ├── api/
│   │   ├── interview/
│   │   │   ├── register/
│   │   │   │   └── route.ts       # User registration API
│   │   │   ├── verify-identity/
│   │   │   │   └── route.ts       # Identity verification API
│   │   │   └── submit/
│   │   │       └── route.ts       # Interview submission API
│   │   └── setup/
│   │       └── database/
│   │           └── route.ts       # Database setup API
│   ├── components/
│   │   └── InterviewProctor.jsx  # Main interview component
│   ├── setup/
│   │   └── page.tsx              # Database setup UI
│   ├── page.tsx                  # Home page
│   └── layout.tsx                # Root layout
├── lib/
│   ├── db.ts                     # Database connection
│   └── models/
│       └── interview.ts          # Database models & queries
├── .env.local                    # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 🗄️ Database Configuration

The `.env.local` file contains:

```env
# PostgreSQL Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=testing
DB_PASSWORD=postgres
DB_PORT=5432

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testing
```

### Change Database Credentials

1. Edit `.env.local`
2. Update the values
3. Restart Next.js server: `npm run dev`

## 🎮 How to Use

### 1. Setup Database (One-time)

Visit: **http://localhost:3000/setup**

Click "Setup Database"

### 2. Start Interview

Visit: **http://localhost:3000**

Complete the flow:
1. Fill user information form
2. Upload resume
3. Accept consents
4. Capture identity photo
5. Read instructions
6. Start interview
7. Answer 10 questions

### 3. View Data in Database

```bash
# Connect to database
psql -U postgres -d testing

# View all interviews
SELECT * FROM interviews;

# View violations
SELECT * FROM violations;

# View answers
SELECT * FROM answers;

# Exit
\q
```

## 🔍 API Endpoints

### POST /api/interview/register
Register new interview and upload resume

```javascript
const formData = new FormData();
formData.append('fullName', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('phone', '+91-1234567890');
formData.append('yearsOfExperience', '5');
formData.append('positionAppliedFor', 'Developer');
formData.append('resume', fileObject);
formData.append('consents', JSON.stringify({...}));

await fetch('/api/interview/register', {
  method: 'POST',
  body: formData
});
```

### POST /api/interview/verify-identity
Submit reference photo and face descriptor

```javascript
await fetch('/api/interview/verify-identity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    interviewId: 'INT-123',
    referencePhoto: 'data:image/jpeg;base64,...',
    faceDescriptor: [0.123, 0.456, ...] // 128 numbers
  })
});
```

### POST /api/interview/submit
Submit complete interview with answers and violations

```javascript
await fetch('/api/interview/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    interviewId: 'INT-123',
    status: 'completed',
    answers: [...],
    violations: [...]
  })
});
```

## 📊 Database Schema

### interviews
- `id` - Interview ID (INT-timestamp)
- `candidate_name`, `candidate_email`, `candidate_phone`
- `position_applied`, `resume_url`
- `status` - registered | in_progress | completed | terminated
- `suspicion_score` - 0-100
- `start_time`, `end_time`

### identity_verifications
- `interview_id` - Foreign key
- `reference_photo_base64` - Captured photo
- `face_descriptor` - 128-float array (JSON)

### violations
- `interview_id` - Foreign key
- `violation_type` - no_face, multiple_faces, looking_away, etc.
- `severity` - low | medium | high | critical
- `timestamp`, `question_number`

### answers
- `interview_id` - Foreign key
- `question_number`, `question_text`
- `answer_text`, `time_spent`

## 🛠️ Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Type Checking
```bash
npx tsc --noEmit
```

### Database Reset

**Web UI Method:**
1. Go to http://localhost:3000/setup
2. Click "Reset Database"
3. Confirm

**API Method:**
```bash
curl -X POST http://localhost:3000/api/setup/database
```

## 🎨 Customization

### Change Interview Questions

Edit `app/components/InterviewProctor.jsx`:

```javascript
const questions = [
  "Your custom question 1",
  "Your custom question 2",
  // Add more...
];
```

### Change Time Per Question

```javascript
const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
```

### Change Database Credentials

Edit `.env.local`:

```env
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
```

## 🔒 Production Deployment

### Environment Variables

Set these in your production environment:

```env
DB_USER=production_user
DB_HOST=your-rds-endpoint.amazonaws.com
DB_NAME=production_db
DB_PASSWORD=strong_password_here
DB_PORT=5432

DATABASE_URL=postgresql://user:password@host:5432/database
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

Add environment variables in Vercel dashboard:
- Settings → Environment Variables → Add all DB_* variables

### SSL for PostgreSQL

Update DATABASE_URL:
```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

## 🐛 Troubleshooting

### Database Connection Failed

**Check if PostgreSQL is running:**
```bash
pg_isready
# or
sudo systemctl status postgresql
```

**Start PostgreSQL:**
```bash
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql@15
```

**Test connection:**
```bash
psql -U postgres -d testing
```

### Port 3000 Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### TypeScript Errors

```bash
# Install types
npm install --save-dev @types/pg

# Check for errors
npx tsc --noEmit
```

### Database Setup Failed

1. Ensure database exists:
```bash
psql -U postgres -l | grep testing
```

2. Create if missing:
```bash
createdb -U postgres testing
```

3. Check credentials in `.env.local`

## 📚 Useful Commands

```bash
# View all databases
psql -U postgres -l

# Connect to database
psql -U postgres -d testing

# View tables
\dt

# View table structure
\d interviews

# Count interviews
SELECT COUNT(*) FROM interviews;

# View recent interviews
SELECT id, candidate_name, status, created_at 
FROM interviews 
ORDER BY created_at DESC 
LIMIT 10;

# Get violation statistics
SELECT 
  violation_type,
  COUNT(*) as count
FROM violations
GROUP BY violation_type;

# Exit psql
\q
```

## 🎯 Next Steps

1. ✅ Database setup complete
2. ✅ Start conducting interviews
3. Optional: Add admin dashboard
4. Optional: Add email notifications
5. Optional: Deploy to production

## 📞 Support

For issues:
1. Check troubleshooting section above
2. Verify PostgreSQL is running
3. Check `.env.local` configuration
4. Review Next.js console for errors

---

**Everything runs in Next.js - No separate Node.js scripts needed!** 🎉
