"use client";

import React, { useEffect, useState, useRef } from "react";

const FaceAnalysisPage = () => {
  const [status, setStatus] = useState("Connecting...");
  const [emotionData, setEmotionData] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    // เปิดกล้องของผู้ใช้
    const openCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, // เปิดการเข้าถึงกล้อง
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
        setStatus("Error accessing the camera");
      }
    };

    openCamera();

    // สร้างการเชื่อมต่อ WebSocket
    const ws = new WebSocket("ws://localhost:8000/emotion-detection");

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

    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

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
        width="50%"
        height="auto"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
};

export default FaceAnalysisPage;