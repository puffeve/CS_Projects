'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountManagement() {
  const [courses, setCourses] = useState([]); // รายวิชาทั้งหมด
  const [searchTerm, setSearchTerm] = useState(''); // คำค้นหาของผู้ใช้
  const [userName, setUserName] = useState(''); // ชื่อผู้ใช้
  const [selectedYear, setSelectedYear] = useState(''); // ปีการศึกษาที่ผู้ใช้เลือก
  const [selectedTerm, setSelectedTerm] = useState(''); // ภาคเรียนที่ผู้ใช้เลือก
  const [errorMessage, setErrorMessage] = useState(''); // ข้อความแสดงข้อผิดพลาด
  const [isSearchTriggered, setIsSearchTriggered] = useState(false); // สถานะการค้นหาว่ามีการกดค้นหาหรือไม่
  const router = useRouter();

  useEffect(() => {
    fetchCourses();

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserName(user.name); // กำหนดชื่อผู้ใช้หากมีการล็อกอิน
    } else {
      router.push('/login'); // หากไม่พบผู้ใช้ให้ไปยังหน้า login
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลรายวิชาจากฐานข้อมูล
  async function fetchCourses() {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      const sortedCourses = data.sort((a, b) => a.courses_id - b.courses_id); // เรียงลำดับรายวิชาตามรหัส
      setCourses(sortedCourses);
    }
  }

  // ฟังก์ชันลบรายวิชา
  async function deleteCourse(courses_id) {
    if (confirm('คุณต้องการลบรายวิชานี้หรือไม่?')) { // ถามผู้ใช้ก่อนลบ
      const { error } = await supabase.from('courses').delete().eq('courses_id', courses_id);
      if (error) {
        console.error('Error deleting course:', error);
      } else {
        fetchCourses(); // รีเฟรชข้อมูลหลังจากลบ
      }
    }
  }

  // ฟังก์ชันออกจากระบบ
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/login'); // พาผู้ใช้กลับไปที่หน้า login หลังออกจากระบบ
    }
  }

  // ฟังก์ชันสำหรับการค้นหา
  const handleSearch = () => {
    if (!searchTerm.trim() && !selectedYear && !selectedTerm) {
      setErrorMessage('กรุณากรอกข้อมูลหรือเลือกตัวเลือกก่อนทำการค้นหา');
      setIsSearchTriggered(false);
      return;
    }
    setErrorMessage('');
    setIsSearchTriggered(true);
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    setIsSearchTriggered(false);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value ? Number(e.target.value) : '');
    setIsSearchTriggered(false);
  };

  const handleTermChange = (e) => {
    setSelectedTerm(e.target.value);
    setIsSearchTriggered(false);
  };

  // ดึงค่าปีการศึกษาเฉพาะที่มีอยู่ในฐานข้อมูล
  const uniqueYears = Array.from(new Set(courses.map(course => course.year)));

  // การกรองรายวิชาตามคำค้นหา, ปีการศึกษา, และภาคเรียน
  const filteredCourses = isSearchTriggered
    ? courses.filter((course) => {
        const matchesSearch = course.namecourses.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = selectedYear ? course.year === selectedYear : true;
        const matchesTerm = selectedTerm ? course.term === selectedTerm : true;
        return matchesSearch && matchesYear && matchesTerm;
      })
    : courses;

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
            
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 text-black px-4 py-2 m-4 rounded-lg"
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
            onChange={handleSearchTermChange}
            className="border rounded-lg px-4 py-2 w-full max-w-md"
          />
          {/* ปีการศึกษา */}
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">เลือกปีการศึกษา</option>
            {uniqueYears.map((year, index) => (
              <option key={index} value={year}>{year}</option>
            ))}
          </select>
          {/* ภาคเรียนการศึกษา */}
          <select
            value={selectedTerm}
            onChange={handleTermChange}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">เลือกภาคเรียน</option>
            {Array.from(new Set(courses.map(course => course.term))).map((term, index) => (
              <option key={index} value={term}>{term}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
            ค้นหา
          </button>
        </div>

        {/* ปุ่มเพิ่มรายวิชา */}
        <div className="flex justify-start mb-4">
          <button
            onClick={() => router.push('/Addcourses')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            เพิ่มรายวิชา
          </button>
        </div>

        {/* ตารางรายการวิชา */}
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
        <div className="bg-white rounded-lg shadow-md p-4">
          <table className="table-auto w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">รหัสรายวิชา</th>
                <th className="border px-4 py-2">ชื่อรายวิชา</th>
                <th className="border px-4 py-2">ภาคเรียนการศึกษา</th>
                <th className="border px-4 py-2">ปีการศึกษา</th>
                <th className="border px-4 py-2">อาจารย์ผู้สอน</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.courses_id} className="border-b">
                  <td className="border px-4 py-2">{course.courses_id}</td>
                  <td className="border px-4 py-2">{course.namecourses}</td>
                  <td className="border px-4 py-2">{course.term}</td>
                  <td className="border px-4 py-2">{course.year}</td>
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
