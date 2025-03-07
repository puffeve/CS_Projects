"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

// Component ใหม่สำหรับแสดงผลอารมณ์แบบเข้าใจง่าย
const EmotionDisplay = ({ faceData, faceCount }) => {
  // แปลงชื่ออารมณ์เป็นภาษาไทย
  const getThaiEmotionName = (emotion) => {
    const mapping = {
      'Anger': 'ความโกรธ',
      'Disgust': 'ความรังเกียจ',
      'Fear': 'ความกลัว',
      'Happiness': 'ความสุข',
      'Sadness': 'ความเศร้า',
      'Surprise': 'ความประหลาดใจ',
      'Neutral': 'เป็นกลาง'
    };
    return mapping[emotion] || emotion;
  };

  // ฟังก์ชันหาสีตามอารมณ์
  const getEmotionColor = (emotion) => {
    const colorMap = {
      'Anger': 'bg-red-100 text-red-800 border-red-300',
      'Disgust': 'bg-green-100 text-green-800 border-green-300',
      'Fear': 'bg-purple-100 text-purple-800 border-purple-300',
      'Happiness': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Sadness': 'bg-blue-100 text-blue-800 border-blue-300',
      'Surprise': 'bg-pink-100 text-pink-800 border-pink-300',
      'Neutral': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colorMap[emotion] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // คำนวณจำนวนอารมณ์แต่ละประเภท
  const emotionCounts = {};
  const allEmotions = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness', 'Surprise', 'Neutral'];
  
  allEmotions.forEach(emotion => emotionCounts[emotion] = 0);
  
  if (faceData && faceData.faceDetails) {
    faceData.faceDetails.forEach(face => {
      emotionCounts[face.dominantEmotion] = (emotionCounts[face.dominantEmotion] || 0) + 1;
    });
  }

  if (!faceData || !faceData.faceDetails || faceData.faceDetails.length === 0) {
    return <div className="p-3 bg-gray-50 rounded-lg">ไม่พบข้อมูลอารมณ์</div>;
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow">
      {/* คำอธิบายวิธีอ่านค่า */}
      <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs border border-blue-100">
        <p className="font-medium">วิธีอ่านข้อมูลอารมณ์:</p>
        <p>• <strong>สัดส่วนนักเรียน</strong>: จำนวนนักเรียนที่แสดงอารมณ์นั้นๆ เทียบกับจำนวนนักเรียนทั้งหมด</p>
        <p>• <strong>ความมั่นใจในการตรวจจับ</strong>: ความมั่นใจของระบบในการระบุอารมณ์แต่ละใบหน้า</p>
      </div>

      {/* ส่วนที่ 1: สัดส่วนนักเรียนตามอารมณ์ */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold border-b pb-1 mb-2">สัดส่วนนักเรียนตามอารมณ์ ({faceCount} คน)</h3>
        <div className="grid grid-cols-1 gap-1">
          {allEmotions.map(emotion => {
            const count = emotionCounts[emotion] || 0;
            const percentage = faceCount > 0 ? (count / faceCount) * 100 : 0;
            
            return (
              <div 
                key={emotion}
                className={`rounded p-1.5 flex justify-between items-center border ${count > 0 ? getEmotionColor(emotion) : 'bg-gray-50 text-gray-500 border-gray-200'}`}
              >
                <span className="text-xs">{getThaiEmotionName(emotion)}:</span>
                <span className="text-xs font-medium">
                  {percentage.toFixed(0)}% ({count}/{faceCount})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ส่วนที่ 2: รายละเอียดความมั่นใจในการตรวจจับแต่ละใบหน้า */}
      <div>
        <h3 className="text-sm font-semibold border-b pb-1 mb-2">ความมั่นใจในการตรวจจับแต่ละใบหน้า</h3>
        <div className="space-y-2">
          {faceData.faceDetails.map((face, index) => (
            <div 
              key={index}
              className={`p-2 rounded border ${face.isNegative ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
            >
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium">ใบหน้าที่ {face.faceId}:</span>
                <span className={`font-bold ${face.isNegative ? 'text-red-700' : 'text-green-700'}`}>
                  {getThaiEmotionName(face.dominantEmotion)} ({face.percentage}%)
                </span>
              </div>
              
              {/* แสดงอารมณ์อื่นๆ ถ้ามีข้อมูล */}
              {face.emotions && (
                <div className="text-xs text-gray-500 mt-1">
                  อารมณ์อื่นๆ: ดูได้จากกรอบใบหน้าในวิดีโอ
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FaceAnalysisPage = () => {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [status, setStatus] = useState("กำลังเชื่อมต่อ...");
  const [emotionData, setEmotionData] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // State for tracking face count
  const [faceCount, setFaceCount] = useState(0);
  // เพิ่ม state สำหรับติดตามอารมณ์ด้านลบและข้อมูลอารมณ์โดยละเอียด
  const [negativeEmotions, setNegativeEmotions] = useState({
    count: 0,
    percentage: 0,
    history: [], // เก็บประวัติการตรวจจับอารมณ์ด้านลบ
    emotionCounts: {}, // เก็บจำนวนอารมณ์แต่ละประเภท
    emotionPercentages: {}, // เก็บเปอร์เซ็นต์ของแต่ละอารมณ์
    faceDetails: [] // เก็บรายละเอียดอารมณ์ของแต่ละใบหน้า
  });
  // เพิ่ม state สำหรับการตั้งค่าแสดงข้อความแนะนำ
  const [showInsights, setShowInsights] = useState(true);
  // เพิ่ม state สำหรับเก็บเวลาเริ่มต้นการวิเคราะห์
  const [analysisStartTime, setAnalysisStartTime] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const courseDataSentRef = useRef(false);
  // เพิ่ม ref สำหรับเก็บประวัติการตรวจจับ
  const detectionHistoryRef = useRef([]);
  
  // useEffect สำหรับการตั้งค่าเริ่มต้น
  useEffect(() => {
    console.log("กำลังเริ่มต้นคอมโพเนนต์ FaceAnalysisPage");
    
    // ตั้งค่าตัวนับเวลาถอยหลัง
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setShowCountdown(false);
          
          // เปิดกล้องและเริ่มการวิเคราะห์
          startAnalysis();
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    // ทำความสะอาดเมื่อคอมโพเนนต์ถูกยกเลิกการติดตั้ง
    return () => {
      console.log("กำลังทำความสะอาดทรัพยากร");
      cleanupResources();
    };
  }, []);

  // ฟังก์ชันเริ่มการวิเคราะห์
  const startAnalysis = async () => {
    try {
      // บันทึกเวลาเริ่มต้นการวิเคราะห์
      setAnalysisStartTime(new Date());
      
      // โหลดข้อมูลรายวิชาจาก localStorage
      await loadCourseData();
      
      // เปิดกล้อง
      await openCamera();
      
      // ส่งข้อมูลรายวิชาก่อนเชื่อมต่อกับการตรวจจับอารมณ์
      // ใช้ HTTP request แทน WebSocket
      await sendCourseDataViaHttp();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเริ่มการวิเคราะห์:", error);
      setStatus("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // โหลดข้อมูลรายวิชาจาก localStorage
  const loadCourseData = async () => {
    try {
      const courseData = localStorage.getItem("selectedCourse");
      console.log("ข้อมูลรายวิชาดิบจาก localStorage:", courseData);
      
      if (!courseData) {
        console.warn("ไม่พบข้อมูลรายวิชาใน localStorage");
        return;
      }
      
      const parsedData = JSON.parse(courseData);
      console.log("ข้อมูลรายวิชาที่แยกวิเคราะห์แล้ว:", parsedData);
      
      // ตรวจสอบความถูกต้อง
      if (!parsedData || !parsedData.courses_id || !parsedData.namecourses) {
        console.warn("ข้อมูลรายวิชาไม่ถูกต้องหรือไม่สมบูรณ์");
        return;
      }
      
      setSelectedCourse(parsedData);
      console.log("ตั้งค่าข้อมูลรายวิชาสำเร็จ:", parsedData);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลรายวิชา:", error);
    }
  };

  // ฟังก์ชันส่งข้อมูลรายวิชาผ่าน HTTP
  const sendCourseDataViaHttp = async () => {
    try {
      // โหลดข้อมูลรายวิชาจาก localStorage โดยตรง
      const courseDataStr = localStorage.getItem("selectedCourse");
      if (!courseDataStr) {
        console.log("ไม่พบข้อมูลรายวิชาใน localStorage ข้ามการส่งข้อมูลรายวิชา");
        connectWebSocket(); // เชื่อมต่อ WebSocket โดยตรง
        return;
      }

      const courseData = JSON.parse(courseDataStr);
      console.log("ข้อมูลรายวิชาจาก localStorage:", courseData);

      if (!courseData || !courseData.courses_id || !courseData.namecourses) {
        console.warn("ข้อมูลรายวิชาไม่ถูกต้องหรือไม่ครบถ้วน");
        connectWebSocket();
        return;
      }

      // เตรียมข้อมูลสำหรับส่ง
      const dataToSend = {
        courses_id: String(courseData.courses_id),
        namecourses: String(courseData.namecourses),
        term: courseData.term ? String(courseData.term) : "1",
        year: courseData.year ? String(courseData.year) : "2568"
      };

      console.log("กำลังส่งข้อมูลรายวิชาไปยัง backend:", dataToSend);

      // ส่งข้อมูลไปยัง backend ผ่าน HTTP
      const response = await fetch("http://localhost:8000/set-course-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("ผลลัพธ์การส่งข้อมูลรายวิชา:", result);
      
      // บันทึกว่าได้ส่งข้อมูลรายวิชาไปแล้ว
      courseDataSentRef.current = true;
      
      // เริ่มการเชื่อมต่อ WebSocket ตรวจจับอารมณ์
      connectWebSocket();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งข้อมูลรายวิชาผ่าน HTTP:", error);
      
      // พยายามเชื่อมต่อ WebSocket อยู่ดี แม้จะมีข้อผิดพลาด
      connectWebSocket();
    }
  };

  // ฟังก์ชันทำความสะอาดทรัพยากร
  const cleanupResources = () => {
    console.log("กำลังทำความสะอาดทรัพยากร...");
    
    // หยุดตัวนับเวลาถอยหลัง
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // หยุดกระแสกล้อง
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

    // ปิดการเชื่อมต่อ WebSocket
    if (wsRef.current) {
      console.log("กำลังปิดการเชื่อมต่อ WebSocket...");
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, "ปิดการเชื่อมต่อปกติ");
        }
      } catch (error) {
        console.error('WebSocket cleanup error:', error);
      }
      wsRef.current = null;
    }

    // ล้าง video และ canvas
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // รีเซ็ตสถานะการส่งข้อมูลรายวิชา
    courseDataSentRef.current = false;
  };

  // ฟังก์ชันกลับไปยังหน้า dashboard
  const handleBack = () => {
    console.log("กำลังกลับไปที่หน้าแดชบอร์ด...");
    cleanupResources();
    
    // ล้างข้อมูลและรีเซ็ตสถานะ
    setEmotionData([]);
    setIsAnalyzing(false);
    setFaceCount(0);
    setNegativeEmotions({
      count: 0,
      percentage: 0,
      history: []
    });
    
    router.push('/Teacher_dashboard');
  };

  // ฟังก์ชันเปิดกล้อง
  const openCamera = async () => {
    try {
      console.log("กำลังเปิดกล้อง...");
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
      throw new Error("ไม่สามารถเข้าถึงกล้องได้");
    }
  };

  // ฟังก์ชันเชื่อมต่อ WebSocket
  const connectWebSocket = () => {
    console.log("กำลังเริ่มเชื่อมต่อ WebSocket การตรวจจับอารมณ์...");
    
    // ตรวจสอบว่ามีการเชื่อมต่อก่อนหน้าหรือไม่
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || 
          wsRef.current.readyState === WebSocket.CONNECTING) {
        console.log("มีการเชื่อมต่อ WebSocket อยู่แล้ว");
        return;
      }
      
      try {
        wsRef.current.close();
      } catch (error) {
        console.error("Error closing existing WebSocket:", error);
      }
    }
    
    // สร้างการเชื่อมต่อใหม่
    try {
      const ws = new WebSocket("ws://localhost:8000/emotion-detection");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket เชื่อมต่อสำเร็จ");
        setStatus("เชื่อมต่อสำเร็จ");
        setIsAnalyzing(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "detecting" && data.emotion_data.length > 0) {
            setEmotionData(data.emotion_data[0].emotions);
            // อัปเดตจำนวนใบหน้า
            setFaceCount(data.emotion_data.length);
            // วิเคราะห์อารมณ์ด้านลบ
            analyzeNegativeEmotions(data.emotion_data);
            // วาดการตรวจจับใบหน้า
            drawFaceDetection(data.emotion_data, data.frame_size);
            // บันทึกประวัติการตรวจจับ
            recordDetectionHistory(data.emotion_data);
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

      ws.onclose = (event) => {
        console.log(`WebSocket ถูกปิด: Code: ${event.code}, Reason: ${event.reason}`);
        setStatus("การเชื่อมต่อถูกตัด");
        
        // หากไม่ได้ปิดการเชื่อมต่อโดยตั้งใจและยังอยู่ในโหมดวิเคราะห์ ให้ลองเชื่อมต่อใหม่
        if (isAnalyzing && event.code !== 1000) {
          console.log("กำลังลองเชื่อมต่อใหม่...");
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("ไม่สามารถเชื่อมต่อกับ WebSocket ได้:", error);
      setStatus("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // เพิ่มฟังก์ชันวิเคราะห์อารมณ์ด้านลบและวิเคราะห์อารมณ์แบบแยกใบหน้า
  const analyzeNegativeEmotions = (emotionData) => {
    // นับจำนวนอารมณ์ด้านลบ (เศร้า, โกรธ, กลัว, รังเกียจ)
    let negativeCount = 0;
    let totalFaces = emotionData.length;
    
    // สร้างตัวแปรเก็บจำนวนอารมณ์แต่ละประเภท
    const emotionCounts = {
      Happiness: 0,
      Sadness: 0,
      Anger: 0,
      Fear: 0,
      Surprise: 0,
      Disgust: 0,
      Neutral: 0
    };
    
    // สร้างตัวแปรเก็บข้อมูลแยกตามใบหน้า
    const faceDetails = [];
    
    emotionData.forEach((data, index) => {
      const dominantEmotion = data.dominant_emotion;
      const emotionProbability = data.emotions[dominantEmotion];
      
      // เพิ่มข้อมูลใบหน้า
      faceDetails.push({
        faceId: index + 1,
        dominantEmotion: dominantEmotion,
        percentage: (emotionProbability * 100).toFixed(1),
        isNegative: ['Sadness', 'Anger', 'Fear', 'Disgust'].includes(dominantEmotion),
        emotions: data.emotions // เก็บข้อมูลอารมณ์ทั้งหมดของใบหน้านี้
      });
      
      // นับจำนวนอารมณ์แต่ละประเภท
      if (dominantEmotion in emotionCounts) {
        emotionCounts[dominantEmotion]++;
      }
      
      // นับอารมณ์ด้านลบ
      if (dominantEmotion === 'Sadness' || dominantEmotion === 'Anger' || 
          dominantEmotion === 'Fear' || dominantEmotion === 'Disgust') {
        negativeCount++;
      }
    });
    
    // คำนวณเปอร์เซ็นต์ของแต่ละอารมณ์
    const emotionPercentages = {};
    for (const emotion in emotionCounts) {
      emotionPercentages[emotion] = totalFaces > 0 
        ? (emotionCounts[emotion] / totalFaces) * 100 
        : 0;
    }
    
    // คำนวณเปอร์เซ็นต์อารมณ์ด้านลบโดยรวม
    const percentage = totalFaces > 0 ? (negativeCount / totalFaces) * 100 : 0;
    
    // บันทึกลงในประวัติ
    const timestamp = new Date().toISOString();
    const history = [...negativeEmotions.history];
    history.push({ 
      timestamp, 
      count: negativeCount, 
      percentage, 
      totalFaces,
      emotionCounts: {...emotionCounts},
      emotionPercentages: {...emotionPercentages},
      faceDetails: [...faceDetails]
    });
    
    // ถ้าประวัติยาวเกินไป ตัดบางส่วนออก
    if (history.length > 30) {
      history.shift(); // ตัดข้อมูลแรกสุดออก
    }
    
    // อัปเดต state
    setNegativeEmotions({
      count: negativeCount,
      percentage: percentage,
      history,
      emotionCounts: emotionCounts,
      emotionPercentages: emotionPercentages,
      faceDetails: faceDetails
    });
  };

  // เพิ่มฟังก์ชันบันทึกประวัติการตรวจจับ
  const recordDetectionHistory = (emotionData) => {
    // สร้างรายการบันทึกใหม่
    const record = {
      timestamp: new Date().toISOString(),
      faceCount: emotionData.length,
      emotions: emotionData.map(data => ({
        dominant: data.dominant_emotion,
        values: data.emotions
      }))
    };
    
    // บันทึกลงใน ref
    detectionHistoryRef.current.push(record);
    
    // จำกัดขนาดประวัติ
    if (detectionHistoryRef.current.length > 100) {
      detectionHistoryRef.current.shift();
    }
  };

  // เพิ่มฟังก์ชันหาช่วงเวลาที่มีอารมณ์ด้านลบสูง
  const findNegativeEmotionPeaks = () => {
    if (negativeEmotions.history.length < 5) return null;
    
    // หาจุดที่มีเปอร์เซ็นต์อารมณ์ด้านลบสูงสุด
    const peaks = negativeEmotions.history
      .filter(entry => entry.percentage >= 35 && entry.totalFaces >= 2) // กรองเฉพาะช่วงที่มีอารมณ์ด้านลบสูงและมีจำนวนใบหน้าเพียงพอ
      .sort((a, b) => b.percentage - a.percentage); // เรียงจากมากไปน้อย
    
    // ถ้ามีจุดที่มีอารมณ์ด้านลบสูง ให้ส่งกลับข้อมูล
    if (peaks.length > 0) {
      const topPeak = peaks[0];
      const peakTime = new Date(topPeak.timestamp);
      const minutesSinceStart = analysisStartTime ? 
        (peakTime - analysisStartTime) / (1000 * 60) : 0;
      
      let periodLabel;
      if (minutesSinceStart < 15) {
        periodLabel = "ต้นคาบ";
      } else if (minutesSinceStart < 30) {
        periodLabel = "กลางคาบ";
      } else {
        periodLabel = "ท้ายคาบ";
      }
      
      return {
        percentage: topPeak.percentage.toFixed(1),
        time: peakTime.toLocaleTimeString('th-TH'),
        period: periodLabel,
        count: topPeak.count,
        totalFaces: topPeak.totalFaces
      };
    }
    
    return null;
  };

  // ฟังก์ชันวาดการตรวจจับใบหน้า
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
      
      // ใช้สีแตกต่างกันตามอารมณ์
      let borderColor = '#00ff00'; // ค่าเริ่มต้นเป็นสีเขียว
      
      // ปรับสีตามอารมณ์
      if (data.dominant_emotion === 'Sadness') {
        borderColor = '#3498db'; // สีน้ำเงิน
      } else if (data.dominant_emotion === 'Anger') {
        borderColor = '#e74c3c'; // สีแดง
      } else if (data.dominant_emotion === 'Fear') {
        borderColor = '#9b59b6'; // สีม่วง
      } else if (data.dominant_emotion === 'Disgust') {
        borderColor = '#2ecc71'; // สีเขียวเข้ม
      } else if (data.dominant_emotion === 'Happiness') {
        borderColor = '#f1c40f'; // สีเหลือง
      } else if (data.dominant_emotion === 'Surprise') {
        borderColor = '#e67e22'; // สีส้ม
      }
      
      context.strokeStyle = borderColor;
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

  const getCourseDisplay = () => {
    if (!selectedCourse) return "ไม่มีรายวิชาที่เลือก";
    return `${selectedCourse.namecourses} (${selectedCourse.courses_id}) - ภาคเรียนที่ ${selectedCourse.term}/${selectedCourse.year}`;
  };

  // ค้นหาจุดที่มีอารมณ์ด้านลบสูง
  const negativePeak = findNegativeEmotionPeaks();

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

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-64 space-y-3">
                {/* Face Count Display */}
                <div className="bg-white/80 rounded-lg p-3 shadow flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold">จำนวนใบหน้าที่ตรวจพบ</p>
                    <p className="text-xl font-bold text-blue-600">{faceCount} ใบหน้า</p>
                  </div>
                </div>
                
                {/* แสดงผลอารมณ์ด้านลบโดยรวม */}
                <div className="bg-white/80 rounded-lg p-3 shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold">อารมณ์ด้านลบโดยรวม</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>สัดส่วนอารมณ์ด้านลบ:</span>
                      <span className="font-medium">{negativeEmotions.percentage.toFixed(1)}% ({negativeEmotions.count}/{faceCount} คน)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${negativeEmotions.percentage > 50 ? "bg-red-500" : negativeEmotions.percentage > 30 ? "bg-orange-400" : "bg-yellow-400"}`}
                        style={{ width: `${negativeEmotions.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      อารมณ์ด้านลบ = ความเศร้า + ความโกรธ + ความกลัว + ความรังเกียจ
                    </p>
                  </div>
                  
                  {/* แสดงตามประเภทอารมณ์ด้านลบ */}
                  {negativeEmotions.emotionCounts && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>เศร้า:</span>
                          <span>{negativeEmotions.emotionCounts.Sadness || 0} คน</span>
                        </div>
                        <div className="flex justify-between">
                          <span>โกรธ:</span>
                          <span>{negativeEmotions.emotionCounts.Anger || 0} คน</span>
                        </div>
                        <div className="flex justify-between">
                          <span>กลัว:</span>
                          <span>{negativeEmotions.emotionCounts.Fear || 0} คน</span>
                        </div>
                        <div className="flex justify-between">
                          <span>รังเกียจ:</span>
                          <span>{negativeEmotions.emotionCounts.Disgust || 0} คน</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* จุดที่มีอารมณ์ด้านลบสูงสุด */}
                {negativePeak && (
                  <div className="bg-red-50 rounded-lg p-3 shadow border border-red-200">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">พบจุดที่มีอารมณ์ด้านลบสูง</h3>
                    <p className="text-xs text-gray-700">ช่วงเวลา: {negativePeak.time} ({negativePeak.period})</p>
                    <p className="text-xs text-gray-700">เปอร์เซ็นต์: {negativePeak.percentage}% ({negativePeak.count}/{negativePeak.totalFaces} คน)</p>
                    <p className="text-xs text-red-700 mt-1 font-medium">อาจมีปัญหาในการเรียนการสอนช่วงนี้</p>
                  </div>
                )}
                
                {/* ใช้ Component ใหม่สำหรับแสดงผลอารมณ์ */}
                <EmotionDisplay 
                  faceData={negativeEmotions} 
                  faceCount={faceCount} 
                />
              </div>

              <div className="flex-1 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto object-cover rounded-lg border border-gray-200"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                {/* คำแนะนำสำหรับห้องเรียน */}
                {showInsights && (
                  <div className="absolute bottom-4 right-4 max-w-sm bg-white/90 p-3 rounded-lg shadow border border-blue-200">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-semibold text-blue-800">คำแนะนำสำหรับการสอน</h3>
                      <button 
                        onClick={() => setShowInsights(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs text-gray-700 space-y-1">
                      {negativeEmotions.percentage > 40 ? (
                        <>
                          <p>• พบอารมณ์ด้านลบค่อนข้างสูง อาจต้องปรับเนื้อหาหรือวิธีการสอน</p>
                          <p>• ลองถามคำถามกับนักเรียนเพื่อกระตุ้นการมีส่วนร่วม</p>
                          <p>• พักสั้น 2-3 นาทีอาจช่วยให้นักเรียนรู้สึกผ่อนคลายขึ้น</p>
                        </>
                      ) : faceCount < 5 ? (
                        <>
                          <p>• จำนวนนักเรียนที่ตรวจพบน้อย อาจเกิดจากการขาดเรียนหรือการวางตำแหน่งกล้อง</p>
                          <p>• ตรวจสอบว่านักเรียนทุกคนอยู่ในพื้นที่ที่กล้องจับภาพได้</p>
                        </>
                      ) : (
                        <>
                          <p>• บรรยากาศการเรียนเป็นปกติ ดำเนินการสอนตามแผนได้</p>
                          <p>• ติดตามอารมณ์นักเรียนอย่างต่อเนื่องเพื่อปรับการสอนให้เหมาะสม</p>
                        </>
                      )}
                      <p className="text-blue-600 text-xs font-medium mt-1">ผลวิเคราะห์ช่วยให้อาจารย์ปรับการสอนให้เหมาะกับอารมณ์ของผู้เรียน</p>
                    </div>
                  </div>
                )}
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