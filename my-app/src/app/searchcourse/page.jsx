'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountManagement() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const router = useRouter();

  const currentYear = new Date().getFullYear(); // ปีคริสต์ศักราช
  const currentBuddhistYear = currentYear + 543; // ปีพุทธศักราช
  const years = Array.from({ length: 11 }, (_, index) => currentBuddhistYear - 5 + index); // ปีพ.ศ. จาก 5 ปีที่ผ่านมา ถึง 5 ปีข้างหน้า

  // ดึงข้อมูลจาก Supabase
  useEffect(() => {
    fetchCourses();

    // ตรวจสอบข้อมูลผู้ใช้ใน localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserName(user.name); // ตั้งชื่อผู้ใช้จากข้อมูลใน localStorage
    } else {
      router.push('/login'); // หากไม่มีข้อมูลผู้ใช้ ให้กลับไปหน้า login
    }
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
          {userName && <div className="text-lg font-semibold mt-4">สวัสดี {userName}</div>}
          <hr className="border-sky-300 my-6" />
          <nav>
            <a href="/searchacc" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลบัญชี</a>
            <a href="/searchcourse" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลรายวิชา</a>
            <a href="/searchimg" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลใบหน้า</a>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 text-white px-4 py-2 m-4 rounded-lg"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">จัดการข้อมูลรายวิชา</h1>

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

        {/* เลือกปีการศึกษาและภาคเรียน */}
        <div className="flex gap-4 mb-4">
          {/* ปีการศึกษา (ปีพุทธศักราช) */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">เลือกปีการศึกษา</option>
            {years.map((year, index) => (
              <option key={index} value={year}>{year}</option>
            ))}
          </select>

          {/* ภาคเรียนการศึกษา */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">เลือกภาคเรียน</option>
            {Array.from(new Set(courses.map(course => course.term))).map((term, index) => (
              <option key={index} value={term}>{term}</option>
            ))}
          </select>

          {/* ปุ่มเพิ่มรายวิชา */}
          <button
            onClick={() => router.push('/Addcourses')}
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
                <th className="border px-4 py-2">รหัสรายวิชา</th>
                <th className="border px-4 py-2">ชื่อรายวิชา</th>
                <th className="border px-4 py-2">ภาคเรียนการศึกษา</th>
                <th className="border px-4 py-2">ปีการศึกษา</th>
                <th className="border px-4 py-2">อาจารย์ผู้สอน</th>
                <th className="border px-4 py-2">ไอดีอาจารย์ผู้สอน</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses
                .filter((course) =>
                  course.namecourses.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .filter((course) => {
                  // ตรวจสอบปีการศึกษาให้ตรงกับ selectedYear (เป็น int)
                  return (selectedYear ? course.year === selectedYear : true) &&
                         (selectedTerm ? course.term === selectedTerm : true);
                })
                .map((course) => (
                  <tr key={course.courses_id} className="border-b">
                    <td className="border px-4 py-2">{course.courses_id}</td>
                    <td className="border px-4 py-2">{course.namecourses}</td>
                    <td className="border px-4 py-2">{course.term}</td>
                    <td className="border px-4 py-2">{course.year}</td>
                    <td className="border px-4 py-2">{course.name_teacher}</td>
                    <td className="border px-4 py-2">{course.user_id}</td>
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
