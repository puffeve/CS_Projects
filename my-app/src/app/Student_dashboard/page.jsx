'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const emotions = [
  'Happy',
  'Sad',
  'Angry',
  'Surprised',
  'Fearful',
  'Disgusted',
  'Neutral'
];

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

  const [userName, setUserName] = useState(''); // ใช้ useState เพื่อเก็บชื่อผู้ใช้จาก localStorage
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
      if (user.role === 'student') {
        setUserName(user.name); // ตั้งค่า userName จาก roll_student
      } else if (user.role === 'teacher') {
        setUserName(user.name); // ตั้งค่า userName จาก roll_teacher (หรือแค่ตรวจสอบให้เหมาะสม)
      } else {
        router.push('/login'); // หากไม่มีข้อมูลผู้ใช้หรือ role ไม่ถูกต้อง ให้กลับไปหน้า login
      }
    } else {
      router.push('/login'); // หากไม่มีข้อมูลผู้ใช้ใน localStorage ให้กลับไปหน้า login
    }
  }, []);
  const handleFileChange = (emotion, event) => {
    const file = event.target.files[0];
    if (file) {
      setImages({
        ...images,
        [emotion]: file,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut(); // ล็อกเอาท์ผู้ใช้จาก Supabase
      localStorage.removeItem('user'); // ลบข้อมูลผู้ใช้จาก localStorage
      router.push('/login'); // กลับไปหน้า login
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Process the uploaded images (e.g., send to server)
    console.log('Uploaded images:', images);
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
          {/* แสดงชื่อผู้ใช้ที่ดึงมาจาก localStorage */}
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
          <h2 className="text-3xl font-semibold mb-8 text-center">Upload Emotion Images</h2>
          <form onSubmit={handleSubmit}>
            {/* Top row with 4 emotion boxes */}
            <div className="grid grid-cols-4 gap-12 mb-8">
              {emotions.slice(0, 4).map((emotion) => (
                <div
                  key={emotion}
                  className="flex flex-col items-center justify-between border border-gray-300 rounded-lg p-4 w-56 h-72 bg-white shadow-md"
                >
                  <label className="text-lg font-bold mb-3">{emotion}</label>
                  <div className="w-48 h-48 bg-gray-200 mb-3">
                    {images[emotion] ? (
                      <img
                        src={URL.createObjectURL(images[emotion])}
                        alt={`${emotion} preview`}
                        className="w-full h-full object-cover rounded-lg" // Ensure image fits within the box
                      />
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(emotion, e)}
                    className="block w-full p-2 text-white bg-pink-200 border-none rounded-lg cursor-pointer mt-3" // Position stays fixed
                  />
                </div>
              ))}
            </div>

            {/* Bottom row with 3 emotion boxes */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              {emotions.slice(4).map((emotion) => (
                <div
                  key={emotion}
                  className="flex flex-col items-center justify-between border border-gray-300 rounded-lg p-4 w-64 h-72 bg-white shadow-md"
                >
                  <label className="text-lg font-bold mb-3">{emotion}</label>
                  <div className="w-48 h-48 bg-gray-200 mb-3">
                    {images[emotion] ? (
                      <img
                        src={URL.createObjectURL(images[emotion])}
                        alt={`${emotion} preview`}
                        className="w-full h-full object-cover rounded-lg" // Ensure image fits within the box
                      />
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(emotion, e)}
                    className="block w-full p-2 text-white bg-pink-200 border-none rounded-lg cursor-pointer mt-3" // Position stays fixed
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="px-8 py-3 bg-pink-400 text-white font-semibold rounded-lg hover:bg-pink-200 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadEmotionImages;
