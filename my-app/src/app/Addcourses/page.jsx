'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AddCourse = () => {
  const [formData, setFormData] = useState({
    courses_id: '',   // ปรับชื่อให้ตรงกับฟิลด์ในฐานข้อมูล
    namecourse: '',    // ปรับชื่อให้ตรงกับฟิลด์ในฐานข้อมูล
    year: '',          // ปรับชื่อให้ตรงกับฟิลด์ในฐานข้อมูล
    teacher: ''        // ปรับชื่อให้ตรงกับฟิลด์ในฐานข้อมูล
  });

  const router = useRouter(); // กำหนดการใช้งาน useRouter สำหรับการนำทาง

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.from('courses').insert([{
        courses_id: formData.courses_id,
        namecourse: formData.namecourse,
        year: formData.year,
        teacher: formData.teacher
      }]);

      if (error) {
        console.error('เกิดข้อผิดพลาดในการแทรกข้อมูล:', error.message);
      } else {
        console.log('แทรกข้อมูลสำเร็จ:', data);
        setFormData({ courses_id: '', namecourse: '', year: '', teacher: '' });
      }
    } catch (err) {
      console.error('ข้อผิดพลาดที่ไม่คาดคิด:', err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('ข้อผิดพลาดในการออกจากระบบ:', error.message);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('ข้อผิดพลาดในการออกจากระบบที่ไม่คาดคิด:', err.message);
    }
  };

  const handleBack = () => {
    router.back(); // นำทางกลับไปหน้าก่อนหน้า
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between">
        <div className="p-6">
          <h1 className="text-xl font-bold">ClassMood Insight</h1>
          <nav className="mt-10">
            <a href="./Adduser" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลบัญชี</a>
            <a href="./Addcourses" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลรายวิชา</a>
            <a href="#" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลใบหน้า</a>
          </nav>
        </div>
        <div className="p-6">
          <button
            className="w-full py-2 px-4 bg-pink-400 hover:bg-pink-200 rounded-lg"
            onClick={handleLogout}
          >
            Log Out 
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 flex justify-center items-center relative">
        {/* ปุ่มย้อนกลับที่อยู่ข้างๆ แถบด้านซ้าย */}
        <button
          onClick={handleBack}
          className="absolute top-6 left-10 py-2 px-4 bg-gray-400 hover:bg-gray-300 text-white rounded-lg"
        >
          ย้อนกลับ
        </button>

        {/* ฟอร์มสำหรับเพิ่มรายวิชา */}
        <div className="bg-sky-50 p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-6">เพิ่มรายวิชา</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">รหัสวิชา</label>
              <input
                type="text"
                name="courses_id"
                value={formData.courses_id}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ชื่อวิชา</label>
              <input
                type="text"
                name="namecourse"
                value={formData.namecourse}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ปีการศึกษา</label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ชื่อครู</label>
              <input
                type="text"
                name="teacher"
                value={formData.teacher}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
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

export default AddCourse;
