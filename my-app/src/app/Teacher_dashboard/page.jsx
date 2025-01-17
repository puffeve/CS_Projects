'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TeacherPage() {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(''); // คอร์สที่เลือกในช่องหลัก
  const [compareCourse, setCompareCourse] = useState(''); // คอร์สที่เลือกสำหรับเปรียบเทียบ
  const [compareType, setCompareType] = useState('same'); // default is same subject
  const [userName, setUserName] = useState('');
  const [courses, setCourses] = useState([]); // สตอร์คอร์สที่ได้จากฐานข้อมูล
  const router = useRouter(); // Hook for navigation

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      if (user.role === 'teacher') {
        setUserName(user.name);
        fetchCourses(user.user_id);
      } else if (user.role === 'student') {
        setUserName(user.name);
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  const fetchCourses = async (userId) => {
    const { data, error } = await supabase
      .from('courses')
      .select('namecourses')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black p-4 relative">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-sky-300 mb-6" />

        <div className="space-y-4">
          <button
            onClick={() => setSelectedAction('analyze')}
            className={`w-full block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 active:bg-sky-700 focus:outline-none rounded-lg ${selectedAction === 'analyze' ? 'bg-sky-500' : ''}`}
          >
            วิเคราะห์ใบหน้า
          </button>
          <button
            onClick={() => setSelectedAction('compare')}
            className={`w-full block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 active:bg-sky-700 focus:outline-none rounded-lg ${selectedAction === 'compare' ? 'bg-sky-500' : ''}`}
          >
            เปรียบเทียบผลวิเคราะห์
          </button>
        </div>

        {/* ปุ่มออกจากระบบ */}
        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-pink-400 hover:bg-pink-500 active:bg-pink-600 focus:outline-none text-black rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">
          {selectedAction === ''
            ? 'เลือกการดำเนินการ'
            : selectedAction === 'analyze'
            ? 'วิเคราะห์ใบหน้า'
            : selectedAction === 'compare'
            ? 'เปรียบเทียบผลวิเคราะห์'
            : 'เลือกการดำเนินการ'}
        </h2>

        {/* การเลือกวิชา */}
        <div>
          <h3 className="text-xl mb-2">เลือกวิชาที่จะดำเนินการ</h3>
          <select
            className="p-2 border border-gray-300 rounded-md mb-4"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">เลือกวิชา</option>
            {courses.map((course) => (
              <option key={course.namecourses} value={course.namecourses}>
                {course.namecourses}
              </option>
            ))}
          </select>
        </div>

        {/* การแสดงผลตามการเลือกการดำเนินการ */}
        {selectedCourse && selectedAction && (
          <div>
            {selectedAction === 'analyze' ? (
              <div>
                <h3 className="text-xl mb-2">วิเคราะห์ใบหน้าในวิชา {selectedCourse}</h3>
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
                    <h4>เปรียบเทียบผลการวิเคราะห์ในวิชา {selectedCourse}</h4>
                    <p>กำลังเปรียบเทียบผลการวิเคราะห์ในวิชา {selectedCourse}...</p>
                  </div>
                ) : (
                  <div>
                    <h4>เปรียบเทียบผลการวิเคราะห์ในวิชาต่างกัน</h4>
                    <select
                      className="p-2 border border-gray-300 rounded-md mb-4"
                      value={compareCourse}
                      onChange={(e) => setCompareCourse(e.target.value)}
                    >
                      <option value="">เลือกวิชาเปรียบเทียบ</option>
                      {courses
                        .filter((course) => course.namecourses !== selectedCourse)
                        .map((course) => (
                          <option key={course.namecourses} value={course.namecourses}>
                            {course.namecourses}
                          </option>
                        ))}
                    </select>
                    <p>กำลังเปรียบเทียบผลการวิเคราะห์ระหว่างวิชา {selectedCourse} และวิชา {compareCourse}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">กรุณาเลือกการดำเนินการจากแถบด้านซ้าย</p>
            )}
          </div>
        )}

        {/* แสดงผลเมื่อยังไม่เลือกวิชา */}
        {selectedCourse === '' && <p className="text-gray-500">กรุณาเลือกวิชาก่อนที่จะดำเนินการ</p>}
      </div>
    </div>
  );
}
