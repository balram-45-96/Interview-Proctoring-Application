'use client';

import { useState } from 'react';
import { Database, Check, X, AlertCircle, Loader2 } from 'lucide-react';

export default function DatabaseSetup() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  const setupDatabase = async () => {
    setStatus('loading');
    setMessage('');
    setDetails(null);

    try {
      const response = await fetch('/api/setup/database', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Database setup completed successfully!');
        setDetails(data);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to setup database');
        setDetails(data);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Network error occurred');
    }
  };

  const resetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete ALL data!')) {
      return;
    }

    setStatus('loading');
    setMessage('');
    setDetails(null);

    try {
      const response = await fetch('/api/setup/database', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Database reset and recreated successfully!');
        setDetails(data);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to reset database');
        setDetails(data);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Network error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Database className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Database Setup
          </h1>
          <p className="text-gray-600">
            Configure your PostgreSQL database for the interview proctoring system
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                Ensure PostgreSQL is installed and running on your system.
                Update the <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> file 
                with your database credentials before running setup.
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Database:</strong> testing</p>
              <p><strong>User:</strong> postgres</p>
              <p><strong>Host:</strong> localhost:5432</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            <button
              onClick={setupDatabase}
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Setting up database...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Setup Database
                </>
              )}
            </button>

            <button
              onClick={resetDatabase}
              disabled={status === 'loading'}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Resetting database...
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Reset Database (Deletes All Data)
                </>
              )}
            </button>
          </div>

          {/* Status Messages */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : status === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start">
                {status === 'success' ? (
                  <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                ) : status === 'error' ? (
                  <X className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      status === 'success'
                        ? 'text-green-900'
                        : status === 'error'
                        ? 'text-red-900'
                        : 'text-gray-900'
                    }`}
                  >
                    {message}
                  </p>
                  {details && (
                    <div className="mt-3">
                      <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
                        {JSON.stringify(details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">What does setup do?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Creates <code className="bg-gray-100 px-2 py-0.5 rounded">interviews</code> table</li>
            <li>✓ Creates <code className="bg-gray-100 px-2 py-0.5 rounded">identity_verifications</code> table</li>
            <li>✓ Creates <code className="bg-gray-100 px-2 py-0.5 rounded">violations</code> table</li>
            <li>✓ Creates <code className="bg-gray-100 px-2 py-0.5 rounded">answers</code> table</li>
            <li>✓ Sets up foreign keys and indexes</li>
            <li>✓ Configures triggers for automatic timestamps</li>
          </ul>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            ← Back to Interview
          </a>
        </div>
      </div>
    </div>
  );
}
