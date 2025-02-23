// TeacherPage.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TeacherPage() {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [userName, setUserName] = useState('');
  const [courses, setCourses] = useState([]);
  const [isCoursePage, setIsCoursePage] = useState(true);
  const [currentYearCourses, setCurrentYearCourses] = useState([]);
  const [previousYearCourses, setPreviousYearCourses] = useState([]);
  const [isHidden, setIsHidden] = useState(false);
  const [otherCourses, setOtherCourses] = useState([]);
  const router = useRouter();

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
      .select('courses_id, namecourses, term, year, user_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      const currentYear = new Date().getFullYear() + 543;
      const currentYearCourses = data.filter((course) => course.year === currentYear);
      const previousYearCourses = data.filter((course) => course.year !== currentYear);

      setCourses(data);
      setCurrentYearCourses(currentYearCourses);
      setPreviousYearCourses(previousYearCourses);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('selectedCourse'); // Clear selected course
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    localStorage.setItem("selectedCourse", JSON.stringify({
      courses_id: course.courses_id,
      namecourses: course.namecourses,
      term: course.term,
      year: course.year
    }));
    setIsCoursePage(false);
  };

  const handleBackClick = () => {
    localStorage.removeItem('selectedCourse'); // Clear selected course
    setIsCoursePage(true);
    setSelectedCourse('');
    setOtherCourses([]);
  };

  const toggleHidden = () => setIsHidden(!isHidden);

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-sky-200 text-black p-4 relative">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-[#305065] mb-6" />
        
        {selectedCourse && (
          <div className="mt-4 flex flex-col items-start space-y-2">
            <button
              onClick={() => router.push('/analyze_face')}
              className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg mr-4 shadow-md transition duration-300"
            >
              วิเคราะห์ใบหน้า
            </button>
            <button
              onClick={() => {
                localStorage.setItem("userName", userName);
                router.push("/result");
              }}
              className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg mr-4 shadow-md transition duration-300"
            >
              ผลวิเคราะห์
            </button>
            <button
              onClick={() => router.push('/compare_result')}
              className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg mr-4 shadow-md transition duration-300"
            >
              เปรียบเทียบผลวิเคราะห์
            </button>
            <button
              onClick={handleBackClick}
              className="w-full bg-gray-600 hover:bg-gray-400 px-4 py-2 rounded-md text-white mt-4"
            >
              ย้อนกลับ
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-pink-400 active:bg-[#1d2f3f] focus:outline-none text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        {isCoursePage ? (
          <>
            <h2 className="text-2xl font-bold mb-4">เลือกรายวิชาก่อนดำเนินการ</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-5 mb-6">
                <h3 className="text-xl mb-4">วิชาปีการศึกษาปัจจุบัน</h3>
                <div className="grid grid-cols-5 gap-4">
                  {currentYearCourses.map((course) => (
                    <button
                      key={course.courses_id}
                      className="bg-white p-4 rounded-lg shadow text-left hover:bg-gray-100"
                      onClick={() => handleCourseClick(course)}
                    >
                      <p>รหัสวิชา: {course.courses_id}</p>
                      <p>ชื่อวิชา: {course.namecourses}</p>
                      <p>ภาคเรียน: {course.term}</p>
                      <p>ปีการศึกษา: {course.year}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleHidden}
                className="mt-4 bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg"
              >
                {isHidden ? 'แสดงวิชาปีการศึกษาเก่า' : 'ซ่อนวิชาปีการศึกษาเก่า'}
              </button>

              {!isHidden && previousYearCourses.length > 0 && (
                <div className="col-span-5">
                  <h3 className="text-xl mb-4">วิชาปีการศึกษาเก่า</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {previousYearCourses.map((course) => (
                      <button
                        key={course.courses_id}
                        className="bg-white p-4 rounded-lg shadow text-left hover:bg-gray-100"
                        onClick={() => handleCourseClick(course)}
                      >
                        <p>รหัสวิชา: {course.courses_id}</p>
                        <p>ชื่อวิชา: {course.namecourses}</p>
                        <p>ภาคเรียน: {course.term}</p>
                        <p>ปีการศึกษา: {course.year}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              ตอนนี้อยู่ในวิชา {selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})
            </h2>
            <p className="text-lg">
              ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}
            </p>
            <p className="text-2xl font-semibold text-center mt-8">โปรดเลือกรายการทำรายการจากแถบเมนูด้านซ้าย</p>
          </>
        )}
      </div>
    </div>
  );
}