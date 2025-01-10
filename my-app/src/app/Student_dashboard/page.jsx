'use client'; // ใช้ directive เพื่อบอกว่าหน้านี้ทำงานในโหมด client-side 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // เชื่อมต่อกับ Supabase

// รายการของอารมณ์ที่ต้องการอัปโหลดรูปภาพ
const emotions = ['Happy', 'Sad', 'Angry', 'Surprised', 'Fearful', 'Disgusted', 'Neutral'];

// คำแปลของอารมณ์แต่ละประเภท
const emotionLabels = {
  Happy: 'สีหน้ามีความสุข',
  Sad: 'สีหน้าเศร้า',
  Angry: 'สีหน้าโกรธ',
  Surprised: 'สีหน้าตกใจ',
  Fearful: 'สีหน้าหวาดกลัว',
  Disgusted: 'สีหน้ารู้สึกขยะแขยง',
  Neutral: 'สีหน้าปกติ',
};

const UploadEmotionImages = () => {
  const [images, setImages] = useState({
    Happy: null,
    Sad: null,
    Angry: null,
    Surprised: null,
    Fearful: null,
    Disgusted: null,
    Neutral: null,
  });

  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      if (user.role === 'student') {
        setUserName(user.name); // เก็บชื่อผู้ใช้
        setUserId(user.user_id); // ดึงค่า user_id มาเก็บใน userId
      } else {
        router.push('/login'); // หากไม่ใช่นักเรียน ให้กลับไปหน้า login
      }
    } else {
      router.push('/login'); // หากไม่มีข้อมูลผู้ใช้ใน localStorage ให้กลับไปหน้า login
    }
  }, [router]);

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงไฟล์รูปภาพในแต่ละ emotion
  const handleFileChange = (emotion, event) => {
    const file = event.target.files[0]; // ดึงไฟล์รูปภาพจาก input
    if (file) {
      setImages({
        ...images, // คัดลอกค่าที่มีอยู่เดิม
        [emotion]: file, // อัปเดตเฉพาะ emotion ที่มีการอัปโหลดไฟล์
      });
    }
  };

  // ฟังก์ชันสำหรับบันทึกรูปภาพไปยัง Supabase
  const handleSubmit = async (event) => {
    event.preventDefault(); // ป้องกันการ reload หน้า

    try {
      const uploadResults = {}; // เก็บ URL ของรูปภาพที่อัปโหลดสำเร็จ
      const uploadDate = new Date().toISOString(); // วันที่อัปโหลดรูปภาพในรูปแบบ ISO

      // วนลูปผ่านทุก emotion เพื่ออัปโหลดรูปภาพ
      for (const emotion of emotions) {
        if (images[emotion]) {
          const filePath = `${userId}/${emotion}-${Date.now()}.jpg`; // ชื่อไฟล์ที่ไม่ซ้ำกัน
          const { data, error } = await supabase.storage
            .from('img_emotion') // ชื่อ Bucket ที่ต้องการอัปโหลด (ใช้ Bucket img_emotion ที่สร้างขึ้น)
            .upload(filePath, images[emotion]); // อัปโหลดไฟล์ไปยัง Supabase

          if (error) {
            throw new Error(`Failed to upload ${emotion} image: ${error.message}`); // แจ้งเตือนหากอัปโหลดล้มเหลว
          }

          // สร้าง URL สาธารณะของไฟล์เพื่อบันทึกลงในฐานข้อมูล
          const { publicUrl } = supabase.storage.from('img_emotion').getPublicUrl(filePath);
          uploadResults[emotion] = publicUrl;
        }
      }

      // บันทึกข้อมูลรูปภาพและผู้ใช้ลงในตาราง img_student
      const { error: insertError } = await supabase.from('img_student').insert([
        {
          user_id: userId, // บันทึก user_id ลงในคอลัมน์ user_id
          name_student: userName,
          img_happy: uploadResults.Happy || null,
          img_sad: uploadResults.Sad || null,
          img_angry: uploadResults.Angry || null,
          img_surprised: uploadResults.Surprised || null,
          img_fearful: uploadResults.Fearful || null,
          img_disgusted: uploadResults.Disgusted || null,
          img_neutral: uploadResults.Neutral || null,
          uploadimg_date: uploadDate,
        },
      ]);

      if (insertError) {
        throw new Error(`Failed to insert record: ${insertError.message}`); // แจ้งเตือนหากการบันทึกล้มเหลว
      }

      alert('Images uploaded and saved successfully!'); // แจ้งเตือนเมื่อสำเร็จ
      setImages({
        Happy: null,
        Sad: null,
        Angry: null,
        Surprised: null,
        Fearful: null,
        Disgusted: null,
        Neutral: null,
      }); // รีเซ็ตฟอร์ม
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Error: ${error.message}`); // แสดงข้อความผิดพลาด
    }
  };

  // ฟังก์ชันสำหรับ Logout ผู้ใช้
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user'); // ลบข้อมูลผู้ใช้จาก localStorage
      router.push('/login'); // กลับไปหน้า login
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar ซ้าย */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
          {userName && <p className="text-lg font-semibold mb-6"> สวัสดี {userName}</p>}
          <hr className="border-sky-300 mb-6" />
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 py-2 px-4 rounded-lg mt-auto hover:bg-pink-200 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto border-4 border-pink-100 rounded-lg shadow-xl bg-pink-50 p-8">
          <h2 className="text-3xl font-semibold mb-8 text-center">อัปโหลดรูปภาพอารมณ์</h2>
          <form onSubmit={handleSubmit}>
            {/* Grid สำหรับแถวแรก */}
            <div className="grid grid-cols-4 gap-12 mb-8">
              {emotions.slice(0, 4).map((emotion) => (
                <div
                  key={emotion}
                  className="flex flex-col items-center justify-between border border-gray-300 rounded-lg p-4 w-56 h-72 bg-white shadow-md"
                >
                  <label className="text-lg font-bold mb-3">{emotionLabels[emotion]}</label>
                  <div className="w-48 h-48 bg-gray-200 mb-3">
                    {images[emotion] ? (
                      <img
                        src={URL.createObjectURL(images[emotion])}
                        alt={`${emotion} preview`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(emotion, e)}
                    className="block w-full p-2 text-white bg-pink-200 border-none rounded-lg cursor-pointer mt-3"
                  />
                </div>
              ))}
            </div>

            {/* Grid สำหรับแถวที่สอง */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              {emotions.slice(4).map((emotion) => (
                <div
                  key={emotion}
                  className="flex flex-col items-center justify-between border border-gray-300 rounded-lg p-4 w-64 h-72 bg-white shadow-md"
                >
                  <label className="text-lg font-bold mb-3">{emotionLabels[emotion]}</label>
                  <div className="w-48 h-48 bg-gray-200 mb-3">
                    {images[emotion] ? (
                      <img
                        src={URL.createObjectURL(images[emotion])}
                        alt={`${emotion} preview`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(emotion, e)}
                    className="block w-full p-2 text-white bg-pink-200 border-none rounded-lg cursor-pointer mt-3"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="px-8 py-3 bg-pink-400 text-white font-semibold rounded-lg hover:bg-pink-200 transition-colors"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadEmotionImages;
