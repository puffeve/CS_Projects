"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const FaceAnalysisPage = () => {
  const [status, setStatus] = useState("กำลังเชื่อมต่อ...");
  const [emotionData, setEmotionData] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  let stream = null;

  // ฟังก์ชันวาดกรอบใบหน้าและข้อความ
  const drawFaceDetection = (emotions, frameSize) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !emotions.length) return;

    const context = canvas.getContext('2d');
    
    // กำหนดขนาด canvas ให้ตรงกับวิดีโอ
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);

    emotions.forEach((data) => {
      const coords = data.face_coords;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // คำนวณพิกัดจริงบนหน้าจอ
      const x1 = coords.x1 * videoWidth;
      const y1 = coords.y1 * videoHeight;
      const x2 = coords.x2 * videoWidth;
      const y2 = coords.y2 * videoHeight;
      
      // วาดกรอบสีเขียว
      context.strokeStyle = '#00ff00';
      context.lineWidth = 2;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // วาดพื้นหลังสำหรับข้อความ
      const text = `${data.emotion} (${Math.round(data.probability * 100)}%)`;
      const textWidth = context.measureText(text).width;
      
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(x1, y1 - 25, textWidth + 10, 25);

      // วาดข้อความแสดงอารมณ์
      context.fillStyle = '#ffffff';
      context.font = '16px Arial';
      context.fillText(text, x1 + 5, y1 - 5);
    });
  };

  useEffect(() => {
    let ws = null;

    const openCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
        setStatus("ไม่สามารถเข้าถึงกล้องได้");
      }
    };

    const connectWebSocket = () => {
      ws = new WebSocket("ws://localhost:8000/emotion-detection");

      ws.onopen = () => {
        console.log("WebSocket connected");
        setStatus("เชื่อมต่อสำเร็จ");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "detecting") {
            setEmotionData(data.emotion_data);
            drawFaceDetection(data.emotion_data, data.frame_size);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          setStatus("ข้อผิดพลาด: รูปแบบข้อมูลไม่ถูกต้อง");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket encountered an error:", error);
        setStatus("ข้อผิดพลาด: ไม่สามารถเชื่อมต่อ WebSocket ได้");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setStatus("การเชื่อมต่อถูกตัด");
      };
    };

    const countdownTimer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === 1) {
          clearInterval(countdownTimer);
          openCamera();
          connectWebSocket();
          return "กำลังเริ่ม...";
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownTimer);
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleBack = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    router.push("/Teacher_dashboard");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">การวิเคราะห์ใบหน้า</h1>
      <p>สถานะ: {status}</p>
      <p>นับถอยหลัง: {countdown}</p>
      
      <div className="mt-4 relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            width: "100%",
            maxWidth: "800px",
            height: "auto",
            objectFit: "cover",
            border: "1px solid black",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            maxWidth: "800px",
            height: "auto",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold">อารมณ์ที่ตรวจพบ:</h2>
        {emotionData.length > 0 ? (
          <ul className="mt-2">
            {emotionData.map((data, index) => (
              <li key={index} className="mb-1">
                {data.emotion} - ความมั่นใจ: {Math.round(data.probability * 100)}%
              </li>
            ))}
          </ul>
        ) : (
          <p>ยังไม่พบข้อมูลอารมณ์</p>
        )}
      </div>

      <button
        onClick={handleBack}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        สิ้นสุดการบันทึกและกลับไปหน้าหลัก
      </button>
    </div>
  );
};

export default FaceAnalysisPage;