from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import cv2
import numpy as np
import dlib
from keras.models import load_model
from datetime import datetime
from collections import Counter
import asyncio
import uuid
from supabase import create_client, Client

# FastAPI App
app = FastAPI()

# Supabase configuration
url = "https://qkiwwxenhfogpaetmxkk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraXd3eGVuaGZvZ3BhZXRteGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExNTQyODAsImV4cCI6MjA0NjczMDI4MH0.pCGKLBQIr8QhXCTzIs_NjP9McB7sdZeTHo2fp3VW0pI"
supabase: Client = create_client(url, key)

# โหลดโมเดลและตัวตรวจจับใบหน้า
model = load_model('model.h5')
detector = dlib.get_frontal_face_detector()
emotion_labels = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness', 'Surprise', 'Neutral']

# เก็บข้อมูลอารมณ์
emotion_data = []
last_detection_time = None

async def summarize_emotion():
    global emotion_data
    while True:
        await asyncio.sleep(30)  # สรุปทุก 30 วินาที
        if emotion_data:
            try:
                # หาอารมณ์ที่พบบ่อยที่สุด
                emotions_only = [data["emotion"] for data in emotion_data if "emotion" in data]
                if emotions_only:
                    most_frequent_emotion = Counter(emotions_only).most_common(1)[0][0]
                    num_faces = len(emotions_only)
                    detection_time = datetime.now().isoformat()
                    
                    # นับจำนวนของอารมณ์ที่พบบ่อยที่สุด
                    emotion_count = sum(1 for e in emotions_only if e == most_frequent_emotion)
                    
                    print(f"สรุปข้อมูล ณ เวลา {detection_time}:")
                    print(f"- อารมณ์ที่พบมากที่สุด: {most_frequent_emotion}")
                    print(f"- จำนวนการตรวจจับทั้งหมด: {num_faces}")
                    print(f"- จำนวนครั้งที่พบอารมณ์หลัก: {emotion_count}")
                    
                    # บันทึกข้อมูลลง Supabase
                    for data in emotion_data:
                        if "emotion" in data and "probability" in data:
                            insert_data = {
                                "id": str(uuid.uuid4()),
                                "detection_time": detection_time,
                                "num_faces": num_faces,
                                "count": emotion_count,
                                "probability": float(data["probability"]),
                                "emotion": data["emotion"]
                            }
                            
                            try:
                                response = supabase.table('emotion_detection').insert(insert_data).execute()
                                print(f"บันทึกข้อมูลลง Supabase สำเร็จ")
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
            
            # ตรวจสอบว่าถึงเวลาตรวจจับหรือยัง (ทุก 5 วินาที)
            if last_detection_time is None or (current_time - last_detection_time).total_seconds() >= 5:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # อ่านขนาดเฟรม
                frame_height, frame_width = frame.shape[:2]
                
                # ตรวจจับใบหน้า
                dets = detector(frame, 1)
                current_emotion_data = []
                
                for d in dets:
                    # รับพิกัดใบหน้า
                    x1, y1, x2, y2 = d.left(), d.top(), d.right(), d.bottom()
                    
                    # แปลงพิกัดเป็นค่าระหว่าง 0-1
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

                    emotion_pred = model.predict(face_array)
                    emotion_index = np.argmax(emotion_pred)
                    emotion = emotion_labels[emotion_index]
                    probability = float(np.max(emotion_pred))

                    current_emotion_data.append({
                        "emotion": emotion,
                        "probability": probability,
                        "face_coords": normalized_coords,
                        "detection_time": current_time.isoformat()
                    })

                # อัพเดทข้อมูลและเวลาตรวจจับล่าสุด
                if current_emotion_data:
                    emotion_data.extend(current_emotion_data)
                    last_detection_time = current_time
                    
                    # ส่งข้อมูลไปยัง frontend
                    await websocket.send_json({
                        "status": "detecting",
                        "frame_size": {
                            "width": int(frame_width),
                            "height": int(frame_height)
                        },
                        "emotion_data": current_emotion_data,
                        "detection_time": current_time.isoformat()
                    })
                    
                    print(f"ตรวจจับอารมณ์ ณ เวลา {current_time.strftime('%H:%M:%S')}")
                    for data in current_emotion_data:
                        print(f"- อารมณ์: {data['emotion']} (ความมั่นใจ: {data['probability']:.2%})")

            await asyncio.sleep(1)  # ตรวจสอบทุก 1 วินาที

    except WebSocketDisconnect:
        print("WebSocket ถูกตัดการเชื่อมต่อ")
    except Exception as e:
        print(f"เกิดข้อผิดพลาด: {e}")
    finally:
        cap.release()

@app.on_event("startup")
async def on_startup():
    asyncio.create_task(summarize_emotion())