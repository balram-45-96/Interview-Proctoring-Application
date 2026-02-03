# 🎯 SETUP GUIDE - Interview Proctoring Application

## ✅ Project Status: READY

Your complete Next.js interview proctoring application has been successfully created!

## 📦 What's Included

### ✅ Configuration Files
- `package.json` - All dependencies installed
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS styling
- `.env.local` - Database credentials

### ✅ Application Structure
- `app/layout.tsx` - Root layout with fonts
- `app/page.tsx` - Home page with feature showcase
- `app/globals.css` - Global styles and Tailwind

### ✅ Interview Components
- `app/components/InterviewProctor.tsx` - Main interview component with:
  - User registration form
  - Resume upload
  - Consent agreements
  - Identity verification with face capture
  - 10 timed interview questions
  - Real-time face detection
  - Tab/window switch detection
  - Violation tracking

### ✅ API Routes
- `app/api/setup/database/route.ts` - Database setup/reset
- `app/api/interview/register/route.ts` - User registration
- `app/api/interview/verify-identity/route.ts` - Face verification
- `app/api/interview/submit/route.ts` - Interview submission

### ✅ Database Layer
- `lib/db.ts` - PostgreSQL connection pool
- `lib/models/interview.ts` - Database models and queries

### ✅ Database Setup UI
- `app/setup/page.tsx` - Web-based database setup interface

## 🚀 How to Use

### Step 1: Server is Running
Your Next.js development server is already running at:
**http://localhost:3000**

### Step 2: Setup PostgreSQL Database (Choose One Method)

#### Method A: Web Interface (Easiest)
1. Open your browser
2. Go to: **http://localhost:3000/setup**
3. Click "Setup Database" button
4. Wait for confirmation

#### Method B: PostgreSQL Command Line
```bash
# Open PostgreSQL
psql -U postgres

# Create database (if not exists)
CREATE DATABASE testing;

# Exit
\q
```

Then use the web interface at http://localhost:3000/setup

### Step 3: Start Using the Application
1. Visit: **http://localhost:3000**
2. Click "Start Interview Process"
3. Follow the steps:
   - Fill in personal information
   - Upload resume
   - Accept consents
   - Capture identity photo
   - Read instructions
   - Answer 10 interview questions

## 🗄️ Database Configuration

Current settings in `.env.local`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=testing
DB_PASSWORD=postgres
DB_PORT=5432
```

**To change credentials:**
1. Edit `.env.local` file
2. Update the values
3. Restart the server

## 📊 Database Schema

The application creates 4 tables:

1. **interviews** - Stores candidate information and interview data
   - Interview ID, name, email, phone
   - Position applied, experience, resume URL
   - Status (registered/in_progress/completed/terminated)
   - Suspicion score, timestamps

2. **identity_verifications** - Stores face verification data
   - Reference photo (base64)
   - Face descriptor (128 float values)
   - Verification timestamp

3. **violations** - Tracks all violations during interview
   - Violation type (tab_switch, no_face, multiple_faces, etc.)
   - Severity (low/medium/high/critical)
   - Description and timestamp

4. **answers** - Stores interview question answers
   - Question number and text
   - Answer text
   - Time spent on question

## 🎯 Features Implemented

✅ **User Registration**
- Form validation
- Resume upload (PDF/DOC/DOCX)
- Data saved to PostgreSQL

✅ **Identity Verification**
- Webcam access
- Face detection using face-api.js
- Reference photo capture
- Face descriptor storage

✅ **Interview Process**
- 10 predefined questions
- 5 minutes per question
- Timer countdown
- Text area for answers

✅ **Real-time Monitoring**
- Face detection every 3 seconds
- Face matching with reference photo
- Multiple face detection
- No face detection

✅ **Violation Detection**
- Tab switching (critical)
- Window blur (high)
- No face detected (high)
- Multiple faces (critical)
- Different person (critical)
- Auto-termination on critical violations

✅ **Data Persistence**
- All data saved to PostgreSQL
- Violations logged with timestamps
- Answers saved with time spent
- Interview status tracking

## 🔧 Useful Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

### Database Management
```bash
# Connect to PostgreSQL
psql -U postgres -d testing

# View tables
\dt

# View interviews
SELECT * FROM interviews;

# View violations
SELECT * FROM violations;

# View answers
SELECT * FROM answers;

# Exit
\q
```

## 🐛 Troubleshooting

### Issue: Cannot connect to database
**Solution:**
1. Ensure PostgreSQL is running:
   ```bash
   pg_isready
   ```
2. Check credentials in `.env.local`
3. Verify database exists:
   ```bash
   psql -U postgres -l | grep testing
   ```

### Issue: Webcam not working
**Solution:**
1. Grant camera permissions in browser
2. Ensure no other app is using the camera
3. Try a different browser

### Issue: Face detection not loading
**Solution:**
1. Check internet connection (models load from CDN)
2. Wait for "Loading face detection models..." to complete
3. Check browser console for errors

### Issue: Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

## 📁 Project Files Overview

```
interview-proctoring-app/
├── app/
│   ├── api/
│   │   ├── interview/
│   │   │   ├── register/route.ts       ✅ Created
│   │   │   ├── verify-identity/route.ts ✅ Created
│   │   │   └── submit/route.ts          ✅ Created
│   │   └── setup/
│   │       └── database/route.ts        ✅ Created
│   ├── components/
│   │   └── InterviewProctor.tsx        ✅ Created
│   ├── setup/
│   │   └── page.tsx                    ✅ Created
│   ├── globals.css                     ✅ Created
│   ├── layout.tsx                      ✅ Created
│   └── page.tsx                        ✅ Created
├── lib/
│   ├── db.ts                           ✅ Created
│   └── models/
│       └── interview.ts                ✅ Created
├── public/
│   └── uploads/
│       └── resumes/                    ✅ Created
├── .env.local                          ✅ Created
├── .eslintrc.json                      ✅ Created
├── .gitignore                          ✅ Created
├── next.config.js                      ✅ Created
├── package.json                        ✅ Created
├── postcss.config.js                   ✅ Created
├── README.md                           ✅ Created
├── tailwind.config.js                  ✅ Created
└── tsconfig.json                       ✅ Created
```

## 🎉 Next Steps

1. ✅ **Dependencies Installed** - All packages ready
2. ✅ **Server Running** - http://localhost:3000
3. ⏳ **Setup Database** - Visit http://localhost:3000/setup
4. ⏳ **Test Interview** - Visit http://localhost:3000
5. ⏳ **Customize** - Modify questions, styling, etc.

## 📝 Customization Options

### Change Interview Questions
Edit `app/components/InterviewProctor.tsx`:
```typescript
const QUESTIONS = [
  "Your custom question 1",
  "Your custom question 2",
  // Add more...
];
```

### Change Time Per Question
Edit `app/components/InterviewProctor.tsx`:
```typescript
const TIME_PER_QUESTION = 300; // seconds (5 minutes)
```

### Change Face Detection Interval
Edit `app/components/InterviewProctor.tsx`:
```typescript
// In startFaceDetection function
}, 3000); // milliseconds (3 seconds)
```

## 🔒 Security Notes

- Face detection runs entirely in the browser
- Face descriptors (128 floats) stored in database
- Reference photos stored as base64
- Tab switching triggers critical violation
- Multiple faces trigger critical violation
- Interview auto-terminates on critical violations

## 📞 Support & Documentation

- Full README: `NEXTJS-README.md`
- This guide: `SETUP-GUIDE.md`
- Project README: `README.md`

## ✅ Verification Checklist

- [x] Next.js 14 installed
- [x] React 18 installed
- [x] TypeScript configured
- [x] Tailwind CSS configured
- [x] PostgreSQL client (pg) installed
- [x] face-api.js installed
- [x] All pages created
- [x] All API routes created
- [x] Database models created
- [x] Interview component created
- [x] Environment variables configured
- [x] Development server running

## 🎊 You're All Set!

Your interview proctoring application is ready to use!

1. Setup database: http://localhost:3000/setup
2. Start interview: http://localhost:3000
3. Check the browser console for any errors
4. Review NEXTJS-README.md for detailed documentation

**Happy Interviewing! 🚀**
