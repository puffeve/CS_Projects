'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AdminPage = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    courses_id: '',
    namecourses: '',
    year: '',
    name_teacher: '', // Changed from teacher to name_teacher to match what's used in handleSubmit
    term: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name);
    } else {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        setUserName(storedUser.name);
      } else {
        router.push('/login');
      }
    }
  }, [currentUser, router]);

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i + 543);
  }

  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('role', 'teacher');
      if (error) {
        setError('Failed to fetch teacher');
      } else {
        setTeachers(data);
      }
    };
    fetchTeachers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.from('courses').insert([{
        courses_id: formData.courses_id,
        namecourses: formData.namecourses,
        term: formData.term,
        year: formData.year,
        name_teacher: formData.name_teacher,
      }]);
      if (error) throw error;

      setSuccess('เพิ่มรายวิชาสำเร็จ!');
      setFormData({
        courses_id: '',
        namecourses: '',
        term: '',
        year: '',
        name_teacher: '',
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      localStorage.removeItem('user');
      router.push('/login');
    } else {
      setError('Logout failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4 h-screen">
        <div>
          <h1 className="text-2xl font-bold">ClassMood Insight</h1>
          {userName && <p className="text-lg font-semibold mt-4">สวัสดี {userName}</p>}
          <hr className="border-black my-6" />
          <nav>
            <a href="/searchacc" className="block py-2.5 px-4 mt-3 bg-pink-400 hover:bg-pink-300 text-white rounded-lg">จัดการข้อมูลบัญชี</a>
            <a href="/searchcourse" className="block py-2.5 px-4 mt-3 bg-pink-400 hover:bg-pink-300 text-white rounded-lg">จัดการข้อมูลรายวิชา</a>
         
          </nav>
        </div>
        <div className="flex-grow"></div>
        <button
          onClick={handleLogout}
          className="bg-red-400 active:bg-[#1d2f3f] text-white px-4 py-2 rounded-lg"
        >
          ออกจากระบบ
        </button>
      </div>

      <div className="flex-1 p-10 flex justify-center items-center">
        <div className="bg-sky-50 p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-6">เพิ่มรายวิชา</h2>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
              <label className="block text-gray-700">รหัสรายวิชา</label>
              <input
                type="text"
                name="courses_id"
                value={formData.courses_id}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                placeholder="กรุณากรอกข้อมูลเป็นตัวเลขเท่านั้น"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ชื่อรายวิชา</label>
              <input
                type="text"
                name="namecourses"
                value={formData.namecourses}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
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
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
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
                <option value="ภาคเรียนที่ 1">ภาคเรียนที่ 1</option>
                <option value="ภาคเรียนที่ 2">ภาคเรียนที่ 2</option>
                <option value="ภาคเรียนฤดูร้อน">ภาคเรียนฤดูร้อน</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ชื่ออาจารย์ผู้สอน</label>
              <select
                name="name_teacher"
                value={formData.name_teacher}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg"
                required
              >
                <option value="">เลือกครูผู้สอน</option>
                {teachers.map((teacher) => (
                  <option key={teacher.name} value={teacher.name}>{teacher.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-pink-400 hover:bg-pink-200 text-white rounded-lg"
            >
              เพิ่มรายวิชา
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
