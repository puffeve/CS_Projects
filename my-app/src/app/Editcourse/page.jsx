'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// คำนวณปี พ.ศ. จากปี ค.ศ. และสร้างปีการศึกษาย้อนหลัง 5 ปี
const currentYear = new Date().getFullYear();  // ปี ค.ศ.
const years = [];

// ปีย้อนหลัง 5 ปี
for (let i = currentYear - 5; i <= currentYear + 5; i++) {
  const buddhistYear = i + 543;  // แปลงจากปี ค.ศ. เป็นปี พ.ศ.
  years.push(buddhistYear);
}

// Sidebar Component
function Sidebar({ onLogout }) {
  return (
    <div className="flex flex-col h-screen w-64 bg-sky-200 text-black">
      <div className="p-4 text-lg font-bold border-b border-gray-700">
        ClassMood Insight
      </div>
      <div className="flex-grow p-4"></div>
      <button
        onClick={onLogout}
        className="mb-4 mx-4 px-4 py-2 bg-pink-400 hover:bg-pink-200 rounded-md text-center"
      >
        Log out
      </button>
    </div>
  );
}

// Edit Course Page
export default function EditCourse() {
  const [course, setCourse] = useState(null); // เก็บข้อมูลของคอร์ส
  const [formData, setFormData] = useState({
    courses_id: '',
    namecourses: '',
    term: '',
    year: '',
    name_teacher: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courses_id'); // รับค่า courseId จาก query parameter

  // ฟังก์ชันดึงข้อมูลของคอร์สตาม courseId
  const fetchCourseData = async () => {
    const { data: courseData, error } = await supabase
      .from('courses')
      .select('*')
      .eq('courses_id', courseId) // ใช้ courseId ในการค้นหาข้อมูล
      .single();

    if (courseData) {
      setCourse(courseData);
      setFormData({
        courses_id: courseData.courses_id,
        namecourses: courseData.namecourses,
        term: courseData.term,
        year: courseData.year,
        name_teacher: courseData.name_teacher,
      });
    }

    if (error) console.error('Error fetching course data:', error);
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // ฟังก์ชันจัดการการเปลี่ยนแปลงของข้อมูลในฟอร์ม
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ฟังก์ชันบันทึกข้อมูลเมื่อมีการแก้ไข
  const handleSave = async () => {
    const { error } = await supabase
      .from('courses')
      .update({
        namecourses: formData.namecourses,
        term: formData.term,
        year: formData.year,
        name_teacher: formData.name_teacher,
      })
      .eq('courses_id', courseId); // อัพเดตข้อมูลที่เลือก

    if (error) {
      console.error('Error updating course data:', error);
      alert('Error saving changes.');
    } else {
      alert('Changes saved successfully!');
      router.push('/searchcourse'); // เมื่อบันทึกเสร็จจะกลับไปยังหน้า SearchCourse
    }
  };

  // ฟังก์ชันสำหรับออกจากระบบ
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    }
  };

  return (
    <div className="flex">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-grow p-10 flex justify-center items-center">
        {/* คอนเทนเนอร์หลักที่ใช้จัดตำแหน่งให้ฟอร์มอยู่ตรงกลาง */}
        <div className="bg-sky-50 p-12 rounded-lg shadow-md w-full max-w-4xl">
          {/* กล่องฟอร์มที่มีพื้นหลังสีฟ้าและเงา */}
          <h1 className="text-3xl font-bold mb-6">แก้ไขรายวิชา</h1>
          <div className="space-y-6">
            {/* ฟอร์มสำหรับแก้ไขข้อมูลคอร์ส */}
            <div>
              <label className="block text-sm font-medium mb-1">รหัสรายวิชา</label>
              <input
                type="text"
                name="courses_id"
                value={formData.courses_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อรายวิชา</label>
              <input
                type="text"
                name="namecourses"
                value={formData.namecourses}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ภาคการศึกษา</label>
              <select
                name="term"
                value={formData.term}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              >
                <option value="">เลือกภาคการศึกษา</option>
                {/* คำอธิบายให้ผู้ใช้เลือกภาคการศึกษา */}
                <option value="ภาคเรียนที่ 1">ภาคเรียนที่ 1</option>
                <option value="ภาคเรียนที่ 2">ภาคเรียนที่ 2</option>
                <option value="ภาคฤดูร้อน">ภาคฤดูร้อน</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ปีการศึกษา</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              >
                <option value="">เลือกปีการศึกษา</option>
                {/* แสดงคำอธิบายให้ผู้ใช้เลือก */}
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่ออาจารย์ผู้สอน</label>
              <input
                type="text"
                name="name_teacher"
                value={formData.name_teacher}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-md"
              />
            </div>
            <div className="flex justify-center items-center mt-6">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-lg"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
