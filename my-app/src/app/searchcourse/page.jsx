'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, []);

  // ดึงข้อมูลรายวิชาจากฐานข้อมูล
  async function fetchCourses() {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses(data);
    }
  }

  // ฟังก์ชันสำหรับลบรายวิชา
  async function deleteCourse(courses_id) {
    if (confirm('คุณต้องการลบรายวิชานี้หรือไม่?')) {
      const { error } = await supabase.from('courses').delete().eq('courses_id', courses_id);
      if (error) {
        console.error('Error deleting course:', error);
      } else {
        fetchCourses();
      }
    }
  }

  // ฟังก์ชันสำหรับออกจากระบบ
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/login');
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/searchacc')}
              className="bg-sky-300 text-black px-4 py-2 rounded-lg text-left"
            >
              จัดการบัญชี
            </button>
            <button
              onClick={() => router.push('/searchcourse')}
              className="bg-sky-300 text-black px-4 py-2 rounded-lg text-left"
            >
              จัดการรายวิชา
            </button>
            <button
              onClick={() => router.push('/FaceDataManagement')}
              className="bg-sky-300 text-black px-4 py-2 rounded-lg text-left"
            >
              จัดการข้อมูลใบหน้า
            </button>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 text-white px-4 py-2 m-4 rounded-lg"
        >
          Log out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">จัดการรายวิชา</h1>
        {/* Centered Search Box and Add Course Button */}
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="ค้นหารายวิชา"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full max-w-md"
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">
              ค้นหา
            </button>
          </div>
          <div>
            <button
              onClick={() => router.push('/Addcourses')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              เพิ่มรายวิชา
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          {courses
            .filter((course) =>
              course.namecourses.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((course) => (
              <div
                key={course.courses_id}
                className="flex items-center justify-between border-b py-2"
              >
                <div>
                  <p className="font-medium">{course.namecourses}</p>
                  <p className="text-gray-500 text-sm">ID: {course.courses_id}</p>
                  <p className="text-gray-500 text-sm">ปี: {course.year}</p>
                  <p className="text-gray-500 text-sm">อาจารย์: {course.name_teacher}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
                    onClick={() => router.push(`/Editcourse?courses_id=${course.courses_id}`)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-lg"
                    onClick={() => deleteCourse(course.courses_id)}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
