'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TeacherPage() {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [compareType, setCompareType] = useState('same'); // default is same subject
  const [userName, setUserName] = useState(''); // เก็บชื่อผู้ใช้
  const subjects = ['วิชาคณิตศาสตร์', 'วิทยาศาสตร์', 'ภาษาอังกฤษ'];
  const router = useRouter(); // Hook for navigation

  // ดึงข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
      if (user.role === 'teacher') {
        setUserName(user.name); // ตั้งค่า userName จาก roll_teacher
      } else if (user.role === 'student') {
        setUserName(user.name); // ตั้งค่า userName จาก roll_student (หรือแค่ตรวจสอบให้เหมาะสม)
      } else {
        router.push('/login'); // หากไม่มีข้อมูลผู้ใช้หรือ role ไม่ถูกต้อง ให้กลับไปหน้า login
      }
    } else {
      router.push('/login'); // หากไม่มีข้อมูลผู้ใช้ใน localStorage ให้กลับไปหน้า login
    }
  }, []);


  const handleSignOut = async () => {
    // Sign out the user from Supabase
    await supabase.auth.signOut();
    // Redirect to the login page
    router.push('/login');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black p-4 relative">
      <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {/* แสดงชื่อผู้ใช้ */}
        {userName && <div className="text-lg font-semibold mb-4">Hello, {userName}</div>}
        <hr className="border-sky-300 mb-6" />

        <div className="space-y-4">
          <button 
            onClick={() => setSelectedAction('analyze')}
            className={`w-full px-4 py-2 text-left rounded-md hover:bg-gray-700 border-2 ${selectedAction === 'analyze' ? 'border-blue-500 bg-gray-700' : 'border-transparent'}`}
          >
            วิเคราะห์ใบหน้า
          </button>
          <button 
            onClick={() => setSelectedAction('compare')}
            className={`w-full px-4 py-2 text-left rounded-md hover:bg-gray-700 border-2 ${selectedAction === 'compare' ? 'border-blue-500 bg-gray-700' : 'border-transparent'}`}
          >
            เปรียบเทียบผลวิเคราะห์
          </button>
        </div>
        {/* ปุ่มออกจากระบบ */}
        <div className="absolute bottom-4 left-4 w-full text-center">
          <button 
            onClick={handleSignOut} // Call the sign-out function on click
            className="w-auto px-4 py-2 bg-pink-400 rounded-md hover:bg-pink-200 mx-auto h-auto"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">เลือกการดำเนินการ</h2>

        {/* การเลือกวิชา */}
        <div>
          <h3 className="text-xl mb-2">เลือกวิชาที่จะดำเนินการ</h3>
          <select 
            className="p-2 border border-gray-300 rounded-md mb-4"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">เลือกวิชา</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {/* การแสดงผลตามการเลือกการดำเนินการ */}
        {selectedSubject && selectedAction && (
          <div>
            {selectedAction === 'analyze' ? (
              <div>
                <h3 className="text-xl mb-2">วิเคราะห์ใบหน้าในวิชา {selectedSubject}</h3>
                {/* ฟอร์มสำหรับวิเคราะห์ใบหน้า */}
                <p>กำลังดำเนินการวิเคราะห์ใบหน้า...</p>
              </div>
            ) : selectedAction === 'compare' ? (
              <div>
                <h3 className="text-xl mb-2">เปรียบเทียบผลวิเคราะห์</h3>

                {/* ตัวเลือกเปรียบเทียบ */}
                <div className="mb-4">
                  <label className="mr-4">เลือกประเภทการเปรียบเทียบ:</label>
                  <select 
                    className="p-2 border border-gray-300 rounded-md"
                    value={compareType}
                    onChange={(e) => setCompareType(e.target.value)}
                  >
                    <option value="same">เปรียบเทียบในวิชาเดียวกัน</option>
                    <option value="different">เปรียบเทียบในวิชาต่างกัน</option>
                  </select>
                </div>

                {/* การแสดงผลตามประเภทการเปรียบเทียบ */}
                {compareType === 'same' ? (
                  <div>
                    <h4>เปรียบเทียบผลการวิเคราะห์ในวิชา {selectedSubject}</h4>
                    {/* ฟอร์มสำหรับเปรียบเทียบในวิชาเดียวกัน */}
                    <p>กำลังเปรียบเทียบผลการวิเคราะห์ในวิชา {selectedSubject}...</p>
                  </div>
                ) : (
                  <div>
                    <h4>เปรียบเทียบผลการวิเคราะห์ในวิชาต่างกัน</h4>
                    <select 
                      className="p-2 border border-gray-300 rounded-md mb-4"
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="">เลือกวิชาเปรียบเทียบ</option>
                      {subjects.filter(subject => subject !== selectedSubject).map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    {/* ฟอร์มสำหรับเปรียบเทียบในวิชาต่างกัน */}
                    <p>กำลังเปรียบเทียบผลการวิเคราะห์ระหว่างวิชา {selectedSubject} และวิชา {compareType}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">กรุณาเลือกการดำเนินการจากแถบด้านซ้าย</p>
            )}
          </div>
        )}

        {/* แสดงผลเมื่อยังไม่เลือกวิชา */}
        {selectedSubject === '' && <p className="text-gray-500">กรุณาเลือกวิชาก่อนที่จะดำเนินการ</p>}
      </div>
    </div>
  );
}
