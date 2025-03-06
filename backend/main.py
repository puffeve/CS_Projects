from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import dlib
from keras.models import load_model
from datetime import datetime, timedelta
from collections import Counter
import asyncio
import uuid
import json
import traceback
from supabase import create_client, Client

# FastAPI App
app = FastAPI()

# เพิ่ม CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# การตั้งค่า Supabase
url = "https://qkiwwxenhfogpaetmxkk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraXd3eGVuaGZvZ3BhZXRteGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExNTQyODAsImV4cCI6MjA0NjczMDI4MH0.pCGKLBQIr8QhXCTzIs_NjP9McB7sdZeTHo2fp3VW0pI"
supabase: Client = create_client(url, key)

# โหลดโมเดลและตัวตรวจจับใบหน้า
model = load_model('model.h5')
detector = dlib.get_frontal_face_detector()
emotion_labels = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness', 'Surprise', 'Neutral']

# ตัวแปรสำหรับเก็บข้อมูลอารมณ์
frame_emotion_data = []  # ข้อมูลอารมณ์จากทุกเฟรม
dominant_emotions_5sec = []  # อารมณ์เด่นทุก 5 วินาที
last_detection_time = None
last_5sec_snapshot_time = None

# ตัวแปร global สำหรับเก็บข้อมูลรายวิชา
current_course_id = None
current_course_name = None
current_course_term = None
current_course_year = None

# เพิ่มตัวแปรติดตามการเชื่อมต่อที่ใช้งานอยู่
active_connections = set()
processing_active = False
tasks = []

# HTTP endpoint สำหรับตั้งค่าข้อมูลรายวิชา
@app.post("/set-course-data")
async def set_course_data(course_data: dict):
    global current_course_id, current_course_name, current_course_term, current_course_year
    
    try:
        print(f"ได้รับข้อมูลรายวิชาผ่าน HTTP: {course_data}")
        
        current_course_id = course_data.get("courses_id")
        current_course_name = course_data.get("namecourses")
        current_course_term = course_data.get("term")
        current_course_year = course_data.get("year")
        
        print(f"ตัวแปร global หลังการอัปเดต:")
        print(f"  รหัสวิชา: {current_course_id}")
        print(f"  ชื่อวิชา: {current_course_name}")
        print(f"  เทอม: {current_course_term}")
        print(f"  ปี: {current_course_year}")
        
        return {
            "status": "success", 
            "message": "ได้รับข้อมูลรายวิชาเรียบร้อยแล้ว",
            "data": {
                "courses_id": current_course_id,
                "namecourses": current_course_name,
                "term": current_course_term,
                "year": current_course_year
            }
        }
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการประมวลผลข้อมูลรายวิชา (HTTP): {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint สำหรับตั้งค่าข้อมูลรายวิชา
@app.websocket("/set-course")
async def set_course(websocket: WebSocket):
    await websocket.accept()
    global current_course_id, current_course_name, current_course_term, current_course_year
    
    try:
        print("รอรับข้อมูลรายวิชาจาก WebSocket...")
        raw_data = await websocket.receive_text()
        print(f"ได้รับข้อมูลดิบ: {raw_data}")
        
        data = json.loads(raw_data)
        print(f"ข้อมูลรายวิชาที่แยกวิเคราะห์แล้ว: {data}")
        
        # กำหนดค่าตัวแปร global
        current_course_id = data.get("courses_id")
        current_course_name = data.get("namecourses")
        current_course_term = data.get("term")
        current_course_year = data.get("year")
        
        print(f"ตัวแปร global หลังการอัปเดต:")
        print(f"  รหัสวิชา: {current_course_id}")
        print(f"  ชื่อวิชา: {current_course_name}")
        print(f"  เทอม: {current_course_term}")
        print(f"  ปีการศึกษา: {current_course_year}")
        
        # ส่งการยืนยันกลับไปยัง client
        response_data = {
            "status": "success",
            "message": "ได้รับข้อมูลรายวิชาเรียบร้อยแล้ว",
            "received_data": {
                "courses_id": current_course_id,
                "namecourses": current_course_name,
                "term": current_course_term,
                "year": current_course_year
            }
        }
        
        await websocket.send_json(response_data)
        print(f"ส่งการยืนยันการรับข้อมูลกลับไปยัง client แล้ว: {response_data}")
        
        # รอให้แน่ใจว่าข้อมูลถูกประมวลผลเรียบร้อย
        await asyncio.sleep(2)
        
        # ตรวจสอบตัวแปร global อีกครั้ง
        print(f"ตรวจสอบตัวแปร global อีกครั้งก่อนปิดการเชื่อมต่อ:")
        print(f"  รหัสวิชา: {current_course_id}")
        print(f"  ชื่อวิชา: {current_course_name}")
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการประมวลผลข้อมูลรายวิชา: {e}")
        traceback_str = traceback.format_exc()
        print(f"รายละเอียดข้อผิดพลาด: {traceback_str}")
        
        try:
            await websocket.send_json({
                "status": "error",
                "message": f"ไม่สามารถประมวลผลข้อมูลรายวิชาได้: {str(e)}"
            })
        except:
            pass
    finally:
        print("กำลังปิดการเชื่อมต่อ WebSocket รายวิชา...")
        await websocket.close()

# ฟังก์ชันสำหรับจับอารมณ์เด่นทุก 5 วินาที
async def capture_dominant_emotion_every_5sec():
    global frame_emotion_data, dominant_emotions_5sec, last_5sec_snapshot_time, processing_active
    
    while True:
        await asyncio.sleep(1)  # ตรวจสอบทุกวินาที
        
        # ตรวจสอบว่ามีการเชื่อมต่อที่ใช้งานอยู่หรือไม่
        if not active_connections:
            processing_active = False
            # รีเซ็ตข้อมูลเมื่อไม่มีการเชื่อมต่อ
            if frame_emotion_data:
                frame_emotion_data = []
                print("ไม่มีการเชื่อมต่อที่ใช้งานอยู่ ล้างข้อมูลอารมณ์")
            continue
        
        processing_active = True
        current_time = datetime.now()
        
        # ตรวจสอบว่าถึงเวลาจับภาพทุก 5 วินาทีหรือไม่
        if (last_5sec_snapshot_time is None or 
            (current_time - last_5sec_snapshot_time).total_seconds() >= 5):
            
            if frame_emotion_data:
                try:
                    # รวบรวมอารมณ์ทั้งหมดจากทุกใบหน้าในทุกเฟรมในช่วง 5 วินาทีที่ผ่านมา
                    all_emotions = []
                    for frame_data in frame_emotion_data:
                        for face_data in frame_data:
                            all_emotions.append(face_data["dominant_emotion"])
                    
                    if all_emotions:
                        # หาอารมณ์ที่พบบ่อยที่สุด
                        emotion_counter = Counter(all_emotions)
                        dominant_emotion, count = emotion_counter.most_common(1)[0]
                        
                        # คำนวณความน่าจะเป็นเฉลี่ยของอารมณ์เด่น
                        probabilities = []
                        for frame_data in frame_emotion_data:
                            for face_data in frame_data:
                                if face_data["dominant_emotion"] == dominant_emotion:
                                    probabilities.append(face_data["emotions"][dominant_emotion])
                        
                        avg_probability = sum(probabilities) / len(probabilities) if probabilities else 0
                        
                        # นับจำนวนใบหน้าในเฟรมล่าสุดเท่านั้น
                        latest_frame = frame_emotion_data[-1] if frame_emotion_data else []
                        latest_num_faces = len(latest_frame)
                        
                        # สร้างข้อมูลสรุป
                        snapshot_data = {
                            "time": current_time.isoformat(),
                            "dominant_emotion": dominant_emotion,
                            "count": count,
                            "probability": float(avg_probability),
                            "num_faces": latest_num_faces  # จำนวนใบหน้าในเฟรมล่าสุด
                        }
                        
                        dominant_emotions_5sec.append(snapshot_data)
                        print(f"จับอารมณ์เด่นทุก 5 วินาที: {dominant_emotion} (ความน่าจะเป็น: {avg_probability:.2f}), จำนวนใบหน้า: {latest_num_faces}")
                        
                        # เก็บเฉพาะข้อมูล 6 รอบล่าสุด (30 วินาที)
                        if len(dominant_emotions_5sec) > 6:
                            dominant_emotions_5sec = dominant_emotions_5sec[-6:]
                
                except Exception as e:
                    print(f"เกิดข้อผิดพลาดในการจับอารมณ์เด่นทุก 5 วินาที: {e}")
                    print(traceback.format_exc())
            
            # ล้างข้อมูลเฟรมเพื่อเตรียมสำหรับรอบถัดไป
            frame_emotion_data = []
            last_5sec_snapshot_time = current_time

# ฟังก์ชันสำหรับสรุปอารมณ์ทุก 30 วินาที
async def summarize_emotion_every_30sec():
    global dominant_emotions_5sec, current_course_id, current_course_name, current_course_term, current_course_year, processing_active
    
    while True:
        await asyncio.sleep(30)  # สรุปทุก 30 วินาที
        
        # ตรวจสอบว่ามีการประมวลผลที่ใช้งานอยู่หรือไม่
        if not processing_active or not active_connections:
            print("ข้ามการสรุปข้อมูลอารมณ์ เนื่องจากไม่มีการประมวลผลที่ใช้งานอยู่หรือไม่มีการเชื่อมต่อที่ใช้งานอยู่")
            continue
        
        print(f"สถานะตัวแปร global ปัจจุบัน:")
        print(f"  รหัสวิชา: {current_course_id}")
        print(f"  ชื่อวิชา: {current_course_name}")
        print(f"  เทอม: {current_course_term}")
        print(f"  ปี: {current_course_year}")
        print(f"  จำนวนข้อมูลอารมณ์ทุก 5 วินาที: {len(dominant_emotions_5sec)}")
        
        if dominant_emotions_5sec:
            try:
                # รวบรวมอารมณ์เด่นจากทุกรอบ 5 วินาที
                emotions_30sec = [data["dominant_emotion"] for data in dominant_emotions_5sec]
                counter_30sec = Counter(emotions_30sec)
                
                if counter_30sec:
                    # หาอารมณ์เด่นในช่วง 30 วินาทีที่ผ่านมา
                    most_frequent_emotion, count = counter_30sec.most_common(1)[0]
                    
                    # คำนวณค่าเฉลี่ยความน่าจะเป็น
                    probabilities = [
                        data["probability"] 
                        for data in dominant_emotions_5sec 
                        if data["dominant_emotion"] == most_frequent_emotion
                    ]
                    avg_probability = sum(probabilities) / len(probabilities) if probabilities else 0
                    
                    # ใช้จำนวนใบหน้าจากข้อมูลล่าสุดแทนค่าเฉลี่ย
                    latest_faces = dominant_emotions_5sec[-1]["num_faces"] if dominant_emotions_5sec else 0
                    
                    # สร้างข้อมูลพื้นฐานที่จะบันทึก
                    detection_time = datetime.now().isoformat()
                    insert_data = {
                        "id": str(uuid.uuid4()),
                        "detection_time": detection_time,
                        "num_faces": latest_faces,  # ใช้จำนวนใบหน้าล่าสุดแทนค่าเฉลี่ย
                        "count": count,
                        "probability": float(avg_probability),
                        "emotion": most_frequent_emotion
                    }
                    
                    # เพิ่มข้อมูลรายวิชาถ้ามี
                    if current_course_id is not None:
                        insert_data["courses_id"] = str(current_course_id)
                        print(f"กำลังเพิ่มรหัสวิชาลงในบันทึก: {current_course_id}")
                    
                    if current_course_name is not None:
                        insert_data["namecourses"] = str(current_course_name)
                        print(f"กำลังเพิ่มชื่อวิชาลงในบันทึก: {current_course_name}")
                    
                    if current_course_term is not None:
                        insert_data["term"] = str(current_course_term)
                    
                    if current_course_year is not None:
                        insert_data["year"] = str(current_course_year)
                    
                    # บันทึกข้อมูลทั้งหมดที่กำลังจะใส่
                    print(f"กำลังใส่ข้อมูลใน Supabase: {insert_data}")
                    
                    try:
                        response = supabase.table('emotion_detection').insert(insert_data).execute()
                        print(f"การตอบกลับจาก Supabase: {response}")
                        
                        # ตรวจสอบว่าข้อมูลรายวิชาถูกรวมในบันทึกที่ใส่หรือไม่
                        inserted_data = response.data[0] if response.data else None
                        course_included = (
                            inserted_data and 
                            inserted_data.get('courses_id') and 
                            inserted_data.get('namecourses')
                        )
                        
                        if course_included:
                            print(f"บันทึกสรุปอารมณ์ 30 วินาทีพร้อมข้อมูลรายวิชาสำเร็จ: {most_frequent_emotion}, วิชา: {inserted_data.get('namecourses')}")
                        else:
                            print(f"คำเตือน: บันทึกสรุปอารมณ์ 30 วินาทีแล้วแต่ข้อมูลรายวิชาอาจหายไป")
                            
                    except Exception as e:
                        print(f"เกิดข้อผิดพลาดในการใส่ข้อมูลใน Supabase: {e}")
                        if hasattr(e, 'details'):
                            print(f"รายละเอียดข้อผิดพลาด: {e.details}")
            
            except Exception as e:
                print(f"เกิดข้อผิดพลาดในการสรุปข้อมูลอารมณ์ 30 วินาที: {e}")
                print(traceback.format_exc())

@app.websocket("/emotion-detection")
async def emotion_detection(websocket: WebSocket):
    await websocket.accept()
    print("INFO:     connection open")
    
    connection_id = id(websocket)  # ใช้ ID ของออบเจกต์ WebSocket เพื่อระบุการเชื่อมต่อที่ไม่ซ้ำกัน
    active_connections.add(connection_id)
    
    cap = cv2.VideoCapture(0)
    global frame_emotion_data, last_detection_time
    
    try:
        while connection_id in active_connections:
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
                
                # เก็บข้อมูลเฟรมปัจจุบันสำหรับการวิเคราะห์ทุก 5 วินาที
                frame_emotion_data.append(current_frame_data)
                last_detection_time = current_time

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        print("INFO:     connection closed")
        print("WebSocket ถูกตัดการเชื่อมต่อ")
    except Exception as e:
        print(f"เกิดข้อผิดพลาด: {e}")
    finally:
        active_connections.discard(connection_id)
        cap.release()
        print(f"ทำความสะอาดทรัพยากรสำหรับการเชื่อมต่อ {connection_id}")

@app.on_event("startup")
async def on_startup():
    global tasks
    
    # เริ่มทั้งสองงานพร้อมกัน
    task1 = asyncio.create_task(capture_dominant_emotion_every_5sec())
    task2 = asyncio.create_task(summarize_emotion_every_30sec())
    
    # เก็บการอ้างอิงไปยังงานเพื่อให้สามารถยกเลิกได้ในภายหลังถ้าจำเป็น
    tasks = [task1, task2]

# เส้นทางรากสำหรับทดสอบ
@app.get("/")
async def root():
    return {"message": "Emotion Detection API พร้อมใช้งาน"}