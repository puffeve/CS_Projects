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
  const [emotionData, setEmotionData] = useState([]); // สำหรับเก็บข้อมูลผลการวิเคราะห์อารมณ์
  const [isAnalyzing, setIsAnalyzing] = useState(false); // สถานะการวิเคราะห์
  const router = useRouter(); // Hook for navigation

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      if (user.role === 'teacher') {
        setUserName(user.name);
        fetchCourses(user.user_id);
        fetchEmotionData(); // ดึงข้อมูลผลการวิเคราะห์อารมณ์ทั้งหมด
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

  const fetchEmotionData = async () => {
    const { data, error } = await supabase
      .from('emotion_detection')
      .select('id, detection_time, num_faces, emotion, count, percentage'); // ลบเงื่อนไข .eq('user_id', userId)

    if (error) {
      console.error('Error fetching emotion data:', error);
    } else {
      setEmotionData(data); // เก็บข้อมูลลงใน state
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const startAnalysis = () => {
    setIsAnalyzing(true); // เริ่มการวิเคราะห์
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false); // หยุดการวิเคราะห์
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
            onClick={() => setSelectedAction('results')}
            className={`w-full block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 active:bg-sky-700 focus:outline-none rounded-lg ${selectedAction === 'results' ? 'bg-sky-500' : ''}`}
          >
            ผลวิเคราะห์
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
            : 'ผลวิเคราะห์'}
        </h2>
        {selectedAction === '' && (
  <p className="text-gray-500">กรุณาเลือกการดำเนินการจากแถบด้านซ้าย</p>
)}

        {/* แสดงผลวิเคราะห์ */}
        {selectedAction === 'results' && (
          <div>
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border px-4 py-2">ลำดับ</th>
                    <th className="border px-4 py-2">เวลาการตรวจจับ</th>
                    <th className="border px-4 py-2">จำนวนใบหน้า</th>
                    <th className="border px-4 py-2">อารมณ์</th>
                    <th className="border px-4 py-2">จำนวน</th>
                    <th className="border px-4 py-2">เปอร์เซ็นต์</th>
                  </tr>
                </thead>
                <tbody>
                  {emotionData.length > 0 ? (
                    emotionData.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="border px-4 py-2">{index + 1}</td>
                        <td className="border px-4 py-2">{item.detection_time}</td>
                        <td className="border px-4 py-2">{item.num_faces}</td>
                        <td className="border px-4 py-2">{item.emotion}</td>
                        <td className="border px-4 py-2">{item.count}</td>
                        <td className="border px-4 py-2">{item.percentage}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center border px-4 py-2">ไม่พบข้อมูลการวิเคราะห์อารมณ์</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* การเลือกวิชา */}
        {selectedAction && selectedAction !== 'results' && (
          <div>
            <h3 className="text-xl mb-2">เลือกวิชาที่จะดำเนินการ</h3>
            <div className="flex space-x-4 mb-4">
              {courses.map((course) => (
                <button
                  key={course.namecourses}
                  onClick={() => {
                    if (!isAnalyzing) {
                      setSelectedCourse(course.namecourses);
                    }
                  }}
                  className={`py-2 px-4 rounded-md ${selectedCourse === course.namecourses ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  disabled={isAnalyzing} // Disable selection during analysis
                  style={{ cursor: isAnalyzing ? 'not-allowed' : 'pointer' }}
                >
                  {course.namecourses}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* การแสดงผลตามการเลือกการดำเนินการ */}
        {selectedCourse && selectedAction && (
          <div>
            {selectedAction === 'analyze' ? (
              <div>
                <h3 className="text-xl mb-2">วิเคราะห์ใบหน้าในวิชา {selectedCourse}</h3>
                <p>กำลังดำเนินการวิเคราะห์ใบหน้า...</p>

                {!isAnalyzing ? (
                  <button
                    onClick={startAnalysis}
                    className="py-2.5 px-4 bg-green-500 text-white rounded-md"
                  >
                    เริ่มการวิเคราะห์
                  </button>
                ) : (
                  <div>
                    <button
                      onClick={stopAnalysis}
                      className="py-2.5 px-4 bg-red-500 text-white rounded-md"
                    >
                      สิ้นสุดการวิเคราะห์
                    </button>
                  </div>
                )}
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
                    <div className="flex space-x-4 mb-4">
                      {courses
                        .filter((course) => course.namecourses !== selectedCourse)
                        .map((course) => (
                          <button
                            key={course.namecourses}
                            onClick={() => setCompareCourse(course.namecourses)}
                            className={`py-2 px-4 rounded-md ${compareCourse === course.namecourses ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                          >
                            {course.namecourses}
                          </button>
                        ))}
                    </div>
                    {compareCourse && (
                      <p>กำลังเปรียบเทียบผลการวิเคราะห์ระหว่างวิชา {selectedCourse} และวิชา {compareCourse}</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
