'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountManagement() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // ดึงข้อมูลจาก Supabase
  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      const sortedCourses = data.sort((a, b) => a.courses_id - b.courses_id);  
      setCourses(sortedCourses);
    }
  }


  // ฟังก์ชันลบข้อมูล
  async function deleteCourse(courses_id) {
    if (confirm('คุณต้องการลบรายวิชานี้หรือไม่?')) {
      const { error } = await supabase.from('courses').delete().eq('courses_id', courses_id);
      if (error) {
        console.error('Error deleting course:', error);
      } else {
        fetchCourses(); // อัปเดตรายการหลังลบ
      }
    }
  }

  // ฟังก์ชัน Log out
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
          <h1 className="text-2xl font-bold">ClassMood Insight</h1>
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
        <h1 className="text-2xl font-bold mb-4">จัดการรายวิชา</h1>

        {/* ช่องค้นหา */}
        <div className="flex items-center gap-4 mb-4">
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

        {/* ปุ่มเพิ่มรายวิชา */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/AddCourse')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            เพิ่มรายวิชา
          </button>
        </div>

        {/* ตารางรายการวิชา */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <table className="table-auto w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Course ID</th>
                <th className="border px-4 py-2">Year</th>
                <th className="border px-4 py-2">Course Name</th>
                <th className="border px-4 py-2">Teacher</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses
                .filter((course) =>
                  course.namecourses.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((course) => (
                  <tr key={course.courses_id} className="border-b">
                    <td className="border px-4 py-2">{course.courses_id}</td>
                    <td className="border px-4 py-2">{course.year}</td>
                    <td className="border px-4 py-2">{course.namecourses}</td>
                    <td className="border px-4 py-2">{course.name_teacher}</td>
                    <td className="border px-4 py-2">
                      <button
                        className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
                        onClick={() => router.push(`/Editcourse?courses_id=${course.courses_id}`)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded-lg ml-2"
                        onClick={() => deleteCourse(course.courses_id)}
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
