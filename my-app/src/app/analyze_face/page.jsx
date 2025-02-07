"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const FaceAnalysisPage = () => {
  const [status, setStatus] = useState("Connecting...");
  const [emotionData, setEmotionData] = useState([]);
  const videoRef = useRef(null);
  const router = useRouter(); // ใช้สำหรับการนำทาง
  let stream = null; // เก็บ Stream ของกล้อง

  useEffect(() => {
    let ws = null;

    const openCamera = async () => {
      try {
        // ขอสิทธิ์เปิดกล้อง
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream; // ผูก stream กับ <video>
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
        setStatus("Error accessing the camera");
      }
    };

    const connectWebSocket = () => {
      ws = new WebSocket("ws://localhost:8000/emotion-detection");

      ws.onopen = () => {
        console.log("WebSocket connected");
        setStatus("Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          if (data.status === "detecting") {
            setEmotionData(data.emotion_data);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          setStatus("Error: Invalid message format");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket encountered an error:", error.message || error);
        setStatus("Error: Unable to connect to WebSocket");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setStatus("Disconnected");
      };
    };

    // เรียกใช้งานฟังก์ชันเปิดกล้องและเชื่อมต่อ WebSocket
    openCamera();
    connectWebSocket();

    // Cleanup function
    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop()); // หยุดกล้อง
      }

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(); // ปิดการเชื่อมต่อ WebSocket
      }
    };
  }, []);

  const handleBack = () => {
    // ปิดกล้องก่อนย้อนกลับ
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }

    // ย้อนกลับไปหน้า Teacher_dashboard
    router.push("/Teacher_dashboard");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Face Analysis</h1>
      <p>Status: {status}</p>
      <div className="mt-4">
        {emotionData.length > 0 ? (
          <ul>
            {emotionData.map((data, index) => (
              <li key={index}>
                Emotion: {data.emotion}, Probability: {data.probability.toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No emotion data detected yet.</p>
        )}
      </div>

      {/* แสดงกล้อง */}
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{
          width: "50%",
          height: "auto",
          objectFit: "cover",
          border: "1px solid black",
        }}
      />

      {/* ปุ่มย้อนกลับ */}
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