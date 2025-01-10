'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const currentYear = new Date().getFullYear();
const years = [];
for (let i = currentYear - 5; i <= currentYear + 5; i++) {
  const buddhistYear = i + 543;
  years.push(buddhistYear);
}

export default function EditCourse() {
  const [userName, setUserName] = useState('');  // เพิ่ม userName ที่จะเก็บชื่อผู้ใช้
  const [course, setCourse] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    courses_id: '',
    namecourses: '',
    term: '',
    year: '',
    name_teacher: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courses_id');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUserName(storedUser.name);
    } else {
      router.push('/login');  // ถ้าไม่มีข้อมูลผู้ใช้ ให้กลับไปหน้า login
    }
  }, []);

  const fetchCourseData = async () => {
    const { data: courseData, error } = await supabase
      .from('courses')
      .select('*')
      .eq('courses_id', courseId)
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

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('role', 'teacher');

    if (error) {
      console.error('Error fetching teachers:', error);
    } else {
      setTeachers(data);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
    fetchTeachers();
  }, [courseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('courses')
      .update({
        namecourses: formData.namecourses,
        term: formData.term,
        year: formData.year,
        name_teacher: formData.name_teacher,
      })
      .eq('courses_id', courseId);

    if (error) {
      console.error('Error updating course data:', error);
      alert('Error saving changes.');
    } else {
      alert('Changes saved successfully!');
      router.push('/searchcourse');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    }
  };

  return (
    <div className="flex">
      {/* ส่ง userName ไปที่ Sidebar */}
      <Sidebar userName={userName} onLogout={handleLogout} />
      <div className="flex-grow p-10 flex justify-center items-center">
        <div className="bg-sky-50 p-12 rounded-lg shadow-md w-full max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">แก้ไขรายวิชา</h1>
          <div className="space-y-6">
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
            <div>
              <label className="block text-gray-700">ภาคการศึกษา</label>
              <select
                name="term"
                value={formData.term}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg"
              >
                <option value="">เลือกภาคการศึกษา</option>
                <option value="ภาคเรียนที่ 1">ภาคเรียนที่ 1</option>
                <option value="ภาคเรียนที่ 2">ภาคเรียนที่ 2</option>
                <option value="ภาคฤดูร้อน">ภาคฤดูร้อน</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">ปีการศึกษา</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg"
              >
                <option value="">เลือกปีการศึกษา</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700">ชื่ออาจารย์ผู้สอน</label>
              <select
                name="name_teacher"
                value={formData.name_teacher}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg"
              >
                <option value="">เลือกอาจารย์ผู้สอน</option>
                {teachers.map((teacher) => (
                  <option key={teacher.name} value={teacher.name}>{teacher.name}</option>
                ))}
              </select>
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

function Sidebar({ userName, onLogout }) {
  return (
    <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4 h-screen">
        <div>
            <h1 className="text-2xl font-bold">ClassMood Insight</h1>
            {userName && <p className="text-lg font-semibold mt-4">สวัสดี {userName}</p>}
            <hr className="border-sky-300 my-6" />
            <nav>
                <a href="/searchacc" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลบัญชี</a>
                <a href="/searchcourse" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลรายวิชา</a>
                <a href="/searchimg" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลใบหน้า</a>
            </nav>
        </div>
        <div className="flex-grow"></div>
        <button
            onClick={onLogout}
            className="bg-pink-400 text-white px-4 py-2 rounded-lg"
        >
            ออกจากระบบ
        </button>
    </div>
  );
}
