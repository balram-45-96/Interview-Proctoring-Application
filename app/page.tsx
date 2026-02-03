'use client';

import { useState } from 'react';
import InterviewProctor from './components/InterviewProctor';
import { Video, Shield, Clock, CheckCircle } from 'lucide-react';

export default function Home() {
  const [showInterview, setShowInterview] = useState(false);

  if (showInterview) {
    return <InterviewProctor />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Interview Proctoring System
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Secure, AI-powered interview platform with real-time face detection 
              and comprehensive violation monitoring
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <Video className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Face Detection</h3>
              <p className="text-gray-600 text-sm">
                Real-time monitoring using advanced face recognition technology
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <Shield className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Violation Tracking</h3>
              <p className="text-gray-600 text-sm">
                Automatic detection of tab switches, multiple faces, and more
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <Clock className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Timed Questions</h3>
              <p className="text-gray-600 text-sm">
                10 interview questions with time tracking for each answer
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Interview Process
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Step 1:</span> Fill in your personal information
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Step 2:</span> Upload your resume (PDF/DOC/DOCX)
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Step 3:</span> Accept consent agreements
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Step 4:</span> Capture identity verification photo
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Step 5:</span> Answer 10 interview questions
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Keep your face visible to the camera at all times</li>
                <li>• Do not switch tabs or windows during the interview</li>
                <li>• Ensure you're in a well-lit environment</li>
                <li>• Only one face should be visible in the camera</li>
                <li>• Interview will be terminated upon critical violations</li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setShowInterview(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Start Interview Process
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <a
              href="/setup"
              className="text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Database Setup
            </a>
            <span className="mx-4 text-gray-400">|</span>
            <span className="text-gray-600">Need help? Contact support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
