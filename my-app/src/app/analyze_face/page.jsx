// FaceAnalysisPage.jsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

const FaceAnalysisPage = () => {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [status, setStatus] = useState("กำลังเชื่อมต่อ...");
  const [emotionData, setEmotionData] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Comprehensive cleanup function
  const cleanupResources = useCallback(() => {
    try {
      // Stop countdown timer
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      // Stop camera stream
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
          } catch (error) {
            console.error('Error stopping camera track:', error);
          }
        });
        streamRef.current = null;
      }

      // Close WebSocket connection
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }

      // Reset component state
      setEmotionData([]);
      setStatus("กำลังเชื่อมต่อ...");
      setShowCountdown(true);
      setCountdown(5);

      // Optional: Clear video and canvas
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } catch (error) {
      console.error('Comprehensive cleanup error:', error);
    }
  }, []);

  // Handle back navigation with complete cleanup and routing
  const handleBack = useCallback(() => {
    // Perform comprehensive cleanup
    cleanupResources();
    
    // Navigate back to Teacher Dashboard
    router.push('/Teacher_dashboard');
  }, [cleanupResources, router]);

  useEffect(() => {
    // Load course data from localStorage
    const loadCourseData = () => {
      const courseData = localStorage.getItem("selectedCourse");
      if (courseData) {
        setSelectedCourse(JSON.parse(courseData));
      }
    };

    loadCourseData();

    // Countdown timer with enhanced tracking
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === 1) {
          clearInterval(countdownTimerRef.current);
          setShowCountdown(false);
          openCamera();
          connectWebSocket();
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    // Cleanup function
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  const openCamera = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      streamRef.current = cameraStream;

      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setStatus("ไม่สามารถเข้าถึงกล้องได้");
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8000/emotion-detection");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setStatus("เชื่อมต่อสำเร็จ");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "detecting" && data.emotion_data.length > 0) {
          setEmotionData(data.emotion_data[0].emotions);
          drawFaceDetection(data.emotion_data, data.frame_size);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setStatus("ข้อผิดพลาด: รูปแบบข้อมูลไม่ถูกต้อง");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("ข้อผิดพลาด: ไม่สามารถเชื่อมต่อ WebSocket ได้");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setStatus("การเชื่อมต่อถูกตัด");
    };
  };

  const drawFaceDetection = (emotions, frameSize) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !emotions.length) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);

    emotions.forEach((data) => {
      const coords = data.face_coords;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const x1 = coords.x1 * videoWidth;
      const y1 = coords.y1 * videoHeight;
      const x2 = coords.x2 * videoWidth;
      const y2 = coords.y2 * videoHeight;
      
      context.strokeStyle = '#00ff00';
      context.lineWidth = 2;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const text = `${data.dominant_emotion} (${Math.round(data.emotions[data.dominant_emotion] * 100)}%)`;
      const textWidth = context.measureText(text).width;
      
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(x1, y1 - 25, textWidth + 10, 25);

      context.fillStyle = '#ffffff';
      context.font = '16px Arial';
      context.fillText(text, x1 + 5, y1 - 5);
    });
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      Anger: "bg-red-400",
      Disgust: "bg-green-400",
      Fear: "bg-slate-400",
      Happiness: "bg-yellow-400",
      Sadness: "bg-blue-400",
      Surprise: "bg-purple-400",
      Neutral: "bg-gray-400"
    };
    return colors[emotion] || "bg-gray-400";
  };

  const getCourseDisplay = () => {
    if (!selectedCourse) return "ไม่มีรายวิชาที่เลือก";
    return `${selectedCourse.namecourses} (${selectedCourse.courses_id}) - ภาคเรียนที่ ${selectedCourse.term}/${selectedCourse.year}`;
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(130deg, rgb(244, 114, 182) 0%, rgb(234, 179, 8) 50%, rgb(59, 130, 246) 100%)',
          opacity: 0.9
        }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {showCountdown ? (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="text-white text-9xl font-bold">{countdown || "เริ่ม"}</div>
            </div>
          ) : null}
          
          <div className="bg-white/90 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">การเรียนของห้องเรียน</p>
                  <p className="text-xs text-gray-500">{getCourseDisplay()}</p>
                </div>
              </div>

              <button className="p-2 bg-gray-100 rounded-lg">
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-6">
              <div className="w-64 space-y-3">
                {Object.entries(emotionData).map(([emotion, probability]) => (
                  <div key={emotion} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{emotion}</span>
                      <span>{Math.round(probability * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getEmotionColor(emotion)}`}
                        style={{ width: `${probability * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-1 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-auto object-cover rounded-lg border border-gray-200"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleBack}
                className="px-4 py-2 bg-[#AB8E7F] text-white rounded-lg hover:bg-[#9A7D6E] transition-colors"
              >
                สิ้นสุดการวิเคราะห์
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceAnalysisPage;