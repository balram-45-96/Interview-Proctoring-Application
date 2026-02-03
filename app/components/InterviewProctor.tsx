'use client';

import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Video,
  X,
  FileText,
  Loader2,
} from 'lucide-react';

// Interview questions
const QUESTIONS = [
  "Tell me about yourself and your professional background.",
  "What are your greatest strengths as a professional?",
  "Describe a challenging project you worked on and how you overcame obstacles.",
  "How do you handle working under pressure and tight deadlines?",
  "Where do you see yourself in the next 5 years?",
  "Describe a time when you had to work with a difficult team member.",
  "What motivates you in your work?",
  "How do you stay updated with the latest industry trends?",
  "Describe your ideal work environment.",
  "Why should we hire you for this position?",
];

const TIME_PER_QUESTION = 300; // 5 minutes in seconds

export default function InterviewProctor() {
  // Stage management
  const [stage, setStage] = useState<
    'form' | 'consent' | 'identity' | 'instructions' | 'interview' | 'complete'
  >('form');

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    yearsOfExperience: '',
    positionAppliedFor: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [consents, setConsents] = useState({
    videoRecording: false,
    dataProcessing: false,
    termination: false,
  });

  // Interview state
  const [interviewId, setInterviewId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<
    Array<{
      questionNumber: number;
      questionText: string;
      answerText: string;
      timeSpent: number;
    }>
  >([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(TIME_PER_QUESTION);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Face detection state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [referenceFaceDescriptor, setReferenceFaceDescriptor] = useState<Float32Array | null>(
    null
  );
  const [violations, setViolations] = useState<
    Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      questionNumber?: number;
      timestamp: Date;
    }>
  >([]);
  const [currentFaceStatus, setCurrentFaceStatus] = useState<string>('Checking...');
  const [eyeStatus, setEyeStatus] = useState<string>('Monitoring...');
  const [consecutiveEyeViolations, setConsecutiveEyeViolations] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [rapidEyeMovements, setRapidEyeMovements] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previousEyePositionRef = useRef<{ left: {x: number, y: number}, right: {x: number, y: number} } | null>(null);
  const lastBlinkTimeRef = useRef<number>(Date.now());
  const eyeClosedCountRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tab visibility detection
  useEffect(() => {
    if (stage === 'interview') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          addViolation('tab_switch', 'critical', 'User switched tabs/windows', currentQuestion + 1);
          alert('⚠️ Tab switch detected! This is a critical violation.');
        }
      };

      const handleBlur = () => {
        addViolation('window_blur', 'high', 'Window lost focus', currentQuestion + 1);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, [stage, currentQuestion]);

  // Load face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('Face detection models loaded');
      } catch (error) {
        console.error('Error loading face detection models:', error);
      }
    };

    loadModels();
  }, []);

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays after stream is loaded
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Error playing video:', err);
          });
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Cannot access webcam. Please grant camera permissions.');
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Add violation
  const addViolation = (
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    questionNumber?: number
  ) => {
    setViolations((prev) => [
      ...prev,
      {
        type,
        severity,
        description,
        questionNumber,
        timestamp: new Date(),
      },
    ]);

    // Terminate interview on critical violations
    if (severity === 'critical') {
      setTimeout(() => {
        terminateInterview();
      }, 2000);
    }
  };

  // Capture identity photo
  const captureIdentityPhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      alert('Please wait for face detection to load');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Detect face
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert('No face detected. Please ensure your face is clearly visible.');
      return;
    }

    // Save reference photo and descriptor
    const photoBase64 = canvas.toDataURL('image/jpeg');
    setReferenceFaceDescriptor(detection.descriptor);

    // Submit identity verification
    try {
      const response = await fetch('/api/interview/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          referencePhoto: photoBase64,
          faceDescriptor: Array.from(detection.descriptor),
        }),
      });

      if (response.ok) {
        setStage('instructions');
      } else {
        const error = await response.json();
        alert(`Failed to verify identity: ${error.error}`);
      }
    } catch (error) {
      console.error('Identity verification error:', error);
      alert('Failed to submit identity verification');
    }
  };

  // Calculate Eye Aspect Ratio for blink detection
  const calculateEyeAspectRatio = (eye: faceapi.Point[]) => {
    // Vertical eye distances
    const verticalDist1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
    );
    const verticalDist2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
    );
    
    // Horizontal eye distance
    const horizontalDist = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
    );
    
    // Eye Aspect Ratio
    const ear = (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
    return ear;
  };

  // Check eye gaze direction and movement
  const checkEyeGaze = (landmarks: faceapi.FaceLandmarks68) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    
    // Calculate eye centers
    const leftEyeCenter = {
      x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length,
    };
    
    const rightEyeCenter = {
      x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length,
    };
    
    const noseTip = nose[3];
    
    // Calculate horizontal gaze deviation
    const eyeMidpoint = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
    };
    
    const horizontalDeviation = Math.abs(noseTip.x - eyeMidpoint.x);
    const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
    
    // Normalized deviation (threshold: 0.3 means looking 30% away from center)
    const normalizedDeviation = horizontalDeviation / eyeDistance;
    
    // Check vertical deviation (looking up/down)
    const verticalDeviation = Math.abs(noseTip.y - eyeMidpoint.y);
    const normalizedVerticalDeviation = verticalDeviation / eyeDistance;
    
    // Calculate Eye Aspect Ratio for both eyes
    const leftEAR = calculateEyeAspectRatio(leftEye);
    const rightEAR = calculateEyeAspectRatio(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2.0;
    
    // Detect blinks (EAR threshold typically around 0.2-0.25)
    const isBlinking = avgEAR < 0.22;
    
    // Detect rapid eye movement
    let rapidMovement = false;
    if (previousEyePositionRef.current) {
      const leftMovement = Math.sqrt(
        Math.pow(leftEyeCenter.x - previousEyePositionRef.current.left.x, 2) +
        Math.pow(leftEyeCenter.y - previousEyePositionRef.current.left.y, 2)
      );
      const rightMovement = Math.sqrt(
        Math.pow(rightEyeCenter.x - previousEyePositionRef.current.right.x, 2) +
        Math.pow(rightEyeCenter.y - previousEyePositionRef.current.right.y, 2)
      );
      
      // If eyes moved more than 25 pixels in 3 seconds, it's rapid movement
      rapidMovement = (leftMovement > 25 || rightMovement > 25);
    }
    
    // Store current eye positions for next comparison
    previousEyePositionRef.current = {
      left: leftEyeCenter,
      right: rightEyeCenter,
    };
    
    return {
      lookingAway: normalizedDeviation > 0.5 || normalizedVerticalDeviation > 0.7,
      horizontalDeviation: normalizedDeviation,
      verticalDeviation: normalizedVerticalDeviation,
      isBlinking,
      eyeAspectRatio: avgEAR,
      rapidMovement,
    };
  };

  // Start face detection monitoring
  const startFaceDetection = () => {
    if (!modelsLoaded || !referenceFaceDescriptor) return;

    setFaceDetectionActive(true);

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length === 0) {
          setCurrentFaceStatus('❌ No face detected');
          setEyeStatus('❌ No eyes detected');
          addViolation('no_face', 'high', 'No face detected', currentQuestion + 1);
          setConsecutiveEyeViolations(0);
        } else if (detections.length > 1) {
          setCurrentFaceStatus('⚠️ Multiple faces detected');
          setEyeStatus('⚠️ Multiple people');
          addViolation('multiple_faces', 'critical', 'Multiple faces in frame', currentQuestion + 1);
          setConsecutiveEyeViolations(0);
        } else {
          // Compare with reference face
          const faceMatcher = new faceapi.FaceMatcher([referenceFaceDescriptor], 0.6);
          const match = faceMatcher.findBestMatch(detections[0].descriptor);

          if (match.label === 'unknown') {
            setCurrentFaceStatus('⚠️ Different person detected');
            setEyeStatus('⚠️ Unknown person');
            addViolation(
              'different_person',
              'critical',
              'Face does not match registered identity',
              currentQuestion + 1
            );
            setConsecutiveEyeViolations(0);
          } else {
            setCurrentFaceStatus('✅ Identity verified');
            
            // Check eye gaze and movements
            const gazeCheck = checkEyeGaze(detections[0].landmarks);
            
            // Track blinks
            if (gazeCheck.isBlinking) {
              eyeClosedCountRef.current++;
              if (eyeClosedCountRef.current >= 2) { // Eyes closed for 6+ seconds
                const timeSinceLastBlink = Date.now() - lastBlinkTimeRef.current;
                if (timeSinceLastBlink > 5000) { // More than 5 seconds
                  setBlinkCount(prev => prev + 1);
                  lastBlinkTimeRef.current = Date.now();
                  eyeClosedCountRef.current = 0;
                }
              }
            } else {
              eyeClosedCountRef.current = 0;
            }
            
            // Track rapid eye movements
            if (gazeCheck.rapidMovement) {
              setRapidEyeMovements(prev => {
                const newCount = prev + 1;
                if (newCount >= 5) {
                  addViolation(
                    'suspicious_eye_movement',
                    'medium',
                    'Rapid eye movements detected - possible reading from another source',
                    currentQuestion + 1
                  );
                  alert('⚠️ Warning: Unusual eye movements detected!');
                  return 0;
                }
                return newCount;
              });
            } else {
              setRapidEyeMovements(0);
            }
            
            // Check if looking away
            if (gazeCheck.lookingAway) {
              setEyeStatus(`⚠️ Eyes looking away (EAR: ${gazeCheck.eyeAspectRatio.toFixed(2)})`);
              setConsecutiveEyeViolations(prev => {
                const newCount = prev + 1;
                
                // Alert after 3 consecutive detections (9 seconds)
                if (newCount === 3) {
                  alert('⚠️ Warning: Please keep your eyes on the screen!');
                  addViolation(
                    'eye_gaze_away',
                    'medium',
                    `Eyes looking away from screen (H: ${gazeCheck.horizontalDeviation.toFixed(2)}, V: ${gazeCheck.verticalDeviation.toFixed(2)}, EAR: ${gazeCheck.eyeAspectRatio.toFixed(2)})`,
                    currentQuestion + 1
                  );
                }
                
                // Critical violation after 6 consecutive detections (18 seconds)
                if (newCount >= 6) {
                  addViolation(
                    'prolonged_eye_gaze_away',
                    'critical',
                    'Prolonged eye gaze away from screen - possible cheating',
                    currentQuestion + 1
                  );
                  return 0; // Reset counter
                }
                
                return newCount;
              });
            } else if (gazeCheck.isBlinking) {
              setEyeStatus(`👁️ Blinking (EAR: ${gazeCheck.eyeAspectRatio.toFixed(2)})`);
              setConsecutiveEyeViolations(0);
            } else {
              setEyeStatus(`✅ Eyes on screen (EAR: ${gazeCheck.eyeAspectRatio.toFixed(2)})`);
              setConsecutiveEyeViolations(0);
            }
          }
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 3000); // Check every 3 seconds
  };

  // Stop face detection
  const stopFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setFaceDetectionActive(false);
    setConsecutiveEyeViolations(0);
    setBlinkCount(0);
    setRapidEyeMovements(0);
    previousEyePositionRef.current = null;
    eyeClosedCountRef.current = 0;
  };

  // Question timer
  useEffect(() => {
    if (stage === 'interview' && timeRemaining > 0) {
      questionTimerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Auto-submit answer when time runs out
      submitAnswer();
    }

    return () => {
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
    };
  }, [stage, timeRemaining]);

  // Submit form and register interview
  const submitForm = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.positionAppliedFor ||
      !resumeFile
    ) {
      alert('Please fill all fields and upload resume');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('yearsOfExperience', formData.yearsOfExperience);
    formDataToSend.append('positionAppliedFor', formData.positionAppliedFor);
    formDataToSend.append('resume', resumeFile);
    formDataToSend.append('consents', JSON.stringify(consents));

    try {
      const response = await fetch('/api/interview/register', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setInterviewId(data.interview.id);
        setStage('consent');
      } else {
        alert(`Registration failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register interview');
    }
  };

  // Start interview
  const startInterview = () => {
    setStage('interview');
    setQuestionStartTime(Date.now());
    // Ensure webcam is still active
    if (!videoRef.current?.srcObject) {
      startWebcam();
    }
    startFaceDetection();
  };

  // Submit answer
  const submitAnswer = () => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    const answer = {
      questionNumber: currentQuestion + 1,
      questionText: QUESTIONS[currentQuestion],
      answerText: currentAnswer || '(No answer provided)',
      timeSpent,
    };

    setAnswers((prev) => [...prev, answer]);
    setCurrentAnswer('');

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setTimeRemaining(TIME_PER_QUESTION);
      setQuestionStartTime(Date.now());
    } else {
      completeInterview();
    }
  };

  // Complete interview
  const completeInterview = async () => {
    stopFaceDetection();
    stopWebcam();

    try {
      const response = await fetch('/api/interview/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          status: 'completed',
          answers: [...answers, {
            questionNumber: currentQuestion + 1,
            questionText: QUESTIONS[currentQuestion],
            answerText: currentAnswer || '(No answer provided)',
            timeSpent: Math.floor((Date.now() - questionStartTime) / 1000),
          }],
          violations,
        }),
      });

      if (response.ok) {
        setStage('complete');
      } else {
        const error = await response.json();
        alert(`Failed to submit interview: ${error.error}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit interview');
    }
  };

  // Terminate interview
  const terminateInterview = async () => {
    stopFaceDetection();
    stopWebcam();

    try {
      await fetch('/api/interview/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          status: 'terminated',
          answers,
          violations,
        }),
      });

      alert('Interview has been terminated due to violations.');
      window.location.href = '/';
    } catch (error) {
      console.error('Termination error:', error);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render different stages
  if (stage === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Candidate Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91-1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience *
              </label>
              <input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({ ...formData, yearsOfExperience: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Applied For *
              </label>
              <input
                type="text"
                value={formData.positionAppliedFor}
                onChange={(e) =>
                  setFormData({ ...formData, positionAppliedFor: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Resume (PDF/DOC/DOCX) *
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {resumeFile ? resumeFile.name : 'Choose file'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={submitForm}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Continue to Consent
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'consent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Consent Agreement</h2>

          <div className="space-y-4 mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={consents.videoRecording}
                onChange={(e) =>
                  setConsents({ ...consents, videoRecording: e.target.checked })
                }
                className="mt-1 mr-3 h-5 w-5"
              />
              <span className="text-sm text-gray-700">
                I consent to video recording and monitoring during the interview process.
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={consents.dataProcessing}
                onChange={(e) =>
                  setConsents({ ...consents, dataProcessing: e.target.checked })
                }
                className="mt-1 mr-3 h-5 w-5"
              />
              <span className="text-sm text-gray-700">
                I consent to the collection and processing of my personal data and facial
                biometric information for verification purposes.
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={consents.termination}
                onChange={(e) => setConsents({ ...consents, termination: e.target.checked })}
                className="mt-1 mr-3 h-5 w-5"
              />
              <span className="text-sm text-gray-700">
                I understand that the interview will be automatically terminated if critical
                violations are detected (tab switching, multiple faces, identity mismatch).
              </span>
            </label>
          </div>

          <button
            onClick={() => {
              if (Object.values(consents).every((v) => v)) {
                setStage('identity');
                startWebcam();
              } else {
                alert('Please accept all consents to continue');
              }
            }}
            disabled={!Object.values(consents).every((v) => v)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Accept and Continue
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'identity') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Identity Verification</h2>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Please position your face clearly in the camera and click "Capture Photo" to
              verify your identity.
            </p>

            {!modelsLoaded && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
                <span>Loading face detection models...</span>
              </div>
            )}

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
                style={{ minHeight: '300px' }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <button
            onClick={captureIdentityPhoto}
            disabled={!modelsLoaded}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <Camera className="h-5 w-5 mr-2" />
            Capture Identity Photo
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Interview Instructions</h2>

          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">10 Questions</p>
                <p className="text-sm text-gray-600">
                  You will be asked 10 interview questions
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="h-6 w-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">5 Minutes Per Question</p>
                <p className="text-sm text-gray-600">
                  Each question has a 5-minute time limit
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Video className="h-6 w-6 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Face & Eye Detection Active</p>
                <p className="text-sm text-gray-600">
                  Keep your face visible and eyes on the screen at all times
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Violations Will Terminate Interview</p>
                <p className="text-sm text-gray-600">
                  Tab switching, multiple faces, looking away, or identity mismatch
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900">
              <strong>⚠️ Important:</strong> Once you start, you cannot pause the interview.
              Make sure you're in a quiet, well-lit environment.
            </p>
          </div>

          <button
            onClick={startInterview}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'interview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 px-4 py-2 rounded-lg">
                  <span className="text-sm font-semibold text-blue-900">
                    Question {currentQuestion + 1} of {QUESTIONS.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span
                    className={`text-lg font-bold ${
                      timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{currentFaceStatus}</span>
                <span className="text-xs font-medium text-blue-600">{eyeStatus}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Main content */}
            <div className="md:col-span-2 space-y-4">
              {/* Question */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {QUESTIONS[currentQuestion]}
                </h3>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={submitAnswer}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {currentQuestion < QUESTIONS.length - 1 ? 'Next Question' : 'Submit Interview'}
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Video feed */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Camera Feed</h4>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                    style={{ minHeight: '200px' }}
                  />
                </div>
              </div>

              {/* Violations */}
              {violations.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Violations ({violations.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {violations.slice(-5).map((v, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded ${
                          v.severity === 'critical'
                            ? 'bg-red-100 text-red-900'
                            : v.severity === 'high'
                            ? 'bg-orange-100 text-orange-900'
                            : 'bg-yellow-100 text-yellow-900'
                        }`}
                      >
                        <div className="font-semibold">{v.type}</div>
                        <div>{v.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Interview Completed!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the interview. Your responses have been recorded and
            will be reviewed by our team.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Interview ID:</strong> {interviewId}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Questions Answered:</strong> {answers.length}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Violations Recorded:</strong> {violations.length}
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
