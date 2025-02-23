from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import cv2
import numpy as np
import dlib
from keras.models import load_model
from datetime import datetime, timedelta
from collections import Counter
import asyncio
import uuid
from supabase import create_client, Client

# FastAPI App
app = FastAPI()

# การตั้งค่า Supabase
url = "https://qkiwwxenhfogpaetmxkk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraXd3eGVuaGZvZ3BhZXRteGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExNTQyODAsImV4cCI6MjA0NjczMDI4MH0.pCGKLBQIr8QhXCTzIs_NjP9McB7sdZeTHo2fp3VW0pI"
supabase: Client = create_client(url, key)

# โหลดโมเดลและตัวตรวจจับใบหน้า
model = load_model('model.h5')
detector = dlib.get_frontal_face_detector()
emotion_labels = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness', 'Surprise', 'Neutral']

# ตัวแปรสำหรับเก็บข้อมูลอารมณ์
emotion_data = []
last_detection_time = None

async def summarize_emotion():
    global emotion_data
    while True:
        await asyncio.sleep(30)  # สรุปทุก 30 วินาที
        if emotion_data:
            try:
                # ดึงข้อมูลเฟรมล่าสุด
                latest_frame = emotion_data[-1]
                detection_time = datetime.now().isoformat()
                
                # รวบรวมอารมณ์จากใบหน้าที่ตรวจพบในเฟรมล่าสุด
                frame_emotions = [data["dominant_emotion"] for data in latest_frame]
                if frame_emotions:
                    most_frequent_emotion = Counter(frame_emotions).most_common(1)[0][0]
                    num_faces = len(frame_emotions)  # จำนวนใบหน้าในเฟรมล่าสุด
                    
                    # คำนวณค่าเฉลี่ยความน่าจะเป็นของอารมณ์ที่พบบ่อยที่สุด
                    probabilities = [
                        data["emotions"][most_frequent_emotion] 
                        for data in latest_frame 
                        if most_frequent_emotion in data["emotions"]
                    ]
                    avg_probability = sum(probabilities) / len(probabilities) if probabilities else 0
                    
                    # บันทึกลง Supabase
                    insert_data = {
                        "id": str(uuid.uuid4()),
                        "detection_time": detection_time,
                        "num_faces": num_faces,
                        "count": num_faces,  # กำหนดให้ count เท่ากับ num_faces
                        "probability": float(avg_probability),
                        "emotion": most_frequent_emotion
                    }
                    
                    try:
                        response = supabase.table('emotion_detection').insert(insert_data).execute()
                        print(f"บันทึกข้อมูลสำเร็จ: {num_faces} ใบหน้า, อารมณ์: {most_frequent_emotion}")
                    except Exception as e:
                        print(f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {e}")
            
            except Exception as e:
                print(f"เกิดข้อผิดพลาดในการสรุปข้อมูล: {e}")
            
            emotion_data.clear()

@app.websocket("/emotion-detection")
async def emotion_detection(websocket: WebSocket):
    await websocket.accept()
    cap = cv2.VideoCapture(0)
    global last_detection_time
    
    try:
        while True:
            current_time = datetime.now()
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_height, frame_width = frame.shape[:2]
            dets = detector(frame, 1)
            current_frame_data = []
            
            for d in dets:
                x1, y1, x2, y2 = d.left(), d.top(), d.right(), d.bottom()
                
                normalized_coords = {
                    "x1": float(x1) / frame_width,
                    "y1": float(y1) / frame_height,
                    "x2": float(x2) / frame_width,
                    "y2": float(y2) / frame_height
                }
                
                face = frame[y1:y2, x1:x2]
                if face.size == 0:
                    continue

                gray_face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
                gray_face = cv2.resize(gray_face, (48, 48))
                face_array = np.expand_dims(gray_face, axis=-1)
                face_array = np.expand_dims(face_array, axis=0)
                face_array = face_array / 255.0

                emotion_pred = model.predict(face_array)[0]
                emotion_probabilities = {
                    emotion: float(prob) 
                    for emotion, prob in zip(emotion_labels, emotion_pred)
                }
                
                dominant_emotion = emotion_labels[np.argmax(emotion_pred)]

                current_frame_data.append({
                    "dominant_emotion": dominant_emotion,
                    "emotions": emotion_probabilities,
                    "face_coords": normalized_coords,
                    "detection_time": current_time.isoformat()
                })

            if current_frame_data:
                await websocket.send_json({
                    "status": "detecting",
                    "frame_size": {
                        "width": int(frame_width),
                        "height": int(frame_height)
                    },
                    "emotion_data": current_frame_data,
                    "detection_time": current_time.isoformat()
                })
                
                # เก็บเฉพาะข้อมูลเฟรมปัจจุบัน
                emotion_data.append(current_frame_data)
                if len(emotion_data) > 1:  # เก็บเฉพาะเฟรมล่าสุด
                    emotion_data.pop(0)
                last_detection_time = current_time

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        print("WebSocket ถูกตัดการเชื่อมต่อ")
    except Exception as e:
        print(f"เกิดข้อผิดพลาด: {e}")
    finally:
        cap.release()

@app.on_event("startup")
async def on_startup():
    asyncio.create_task(summarize_emotion())
