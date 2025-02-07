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
url = "https://qkiwwxenhfogpaetmxkk.supabase.co"  # Replace with your Supabase URL
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraXd3eGVuaGZvZ3BhZXRteGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExNTQyODAsImV4cCI6MjA0NjczMDI4MH0.pCGKLBQIr8QhXCTzIs_NjP9McB7sdZeTHo2fp3VW0pI"  # Replace with your Supabase API Key
supabase: Client = create_client(url, key)

# Load pre-trained emotion detection model
model = load_model('model.h5')
detector = dlib.get_frontal_face_detector()
emotion_labels = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness', 'Surprise', 'Neutral']

# Store emotion data
emotion_data = []

async def summarize_emotion():
    global emotion_data
    while True:
        await asyncio.sleep(30)  # Summarize every 30 seconds
        if emotion_data:
            most_frequent_emotion = Counter([data["emotion"] for data in emotion_data]).most_common(1)[0][0]
            num_faces = len(emotion_data)
            detection_time = datetime.now().isoformat()
            print(f"Summary: Time: {detection_time}, Emotion: {most_frequent_emotion}, Faces: {num_faces}")
            emotion_data.clear()

            # Calculate count of most frequent emotion
            emotion_count = sum(1 for data in emotion_data if data["emotion"] == most_frequent_emotion)

            # Insert data into Supabase table
            for data in emotion_data:
                insert_data = {
                    "id": str(uuid.uuid4()),  # Generate a unique ID for the record
                    "detection_time": detection_time,
                    "num_faces": num_faces,
                    "count": emotion_count,
                    "probability": data.get("probability"),
                    "emotion": data["emotion"]
                }

                response = supabase.table('emotion_detection').insert(insert_data).execute()
                print(f"Inserted data into Supabase: {response}")

@app.websocket("/emotion-detection")
async def emotion_detection(websocket: WebSocket):
    await websocket.accept()
    cap = cv2.VideoCapture(0)  # Open webcam

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Detect faces and emotions
            dets = detector(frame, 1)
            emotion_data.clear()

            for d in dets:
                x1, y1, x2, y2 = d.left(), d.top(), d.right(), d.bottom()
                face = frame[y1:y2, x1:x2]
                if face.size == 0:
                    continue

                gray_face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
                gray_face = cv2.resize(gray_face, (48, 48))
                face_array = np.expand_dims(gray_face, axis=-1)
                face_array = np.expand_dims(face_array, axis=0)
                face_array = face_array / 255.0

                emotion_pred = model.predict(face_array)
                emotion = emotion_labels[np.argmax(emotion_pred)]
                probability = np.max(emotion_pred)

                emotion_data.append({"emotion": emotion, "probability": float(probability)})

            if emotion_data:
                await websocket.send_json({
                    "status": "detecting",
                    "emotion_data": emotion_data
                })

            await asyncio.sleep(5)

    except WebSocketDisconnect:
        print("WebSocket disconnected.")
    finally:
        cap.release()

@app.on_event("startup")
async def on_startup():
    asyncio.create_task(summarize_emotion())