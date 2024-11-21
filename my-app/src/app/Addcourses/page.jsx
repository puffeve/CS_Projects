'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AddCourse = () => {
    const [formData, setFormData] = useState({
      courseCode: '',
      courseName: '',
      academicYear: '',
      teacherName: ''
    });
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      // ส่งข้อมูลไปยัง server หรือจัดการตามที่ต้องการ
      console.log(formData);
    };
  
    return (
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-sky-200 text-black flex flex-col justify-between">
          <div className="p-6">
            <h1 className="text-xl font-bold">ClassMood Insight</h1>
            <nav className="mt-10">
              <a href="./Adduser" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลบัญชี</a>
              <a href="#" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลรายวิชา</a>
              <a href="#" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลใบหน้า</a>
            </nav>
          </div>
          <div className="p-6">
            <button className="w-full py-2 px-4 bg-pink-400 hover:bg-pink-200 rounded-lg">ออกจากระบบ</button>
          </div>
        </div>
  
        {/* Main Content */}
        <div className="flex-1 p-10 flex justify-center items-center">
          <div className="bg-sky-50 p-8 rounded-lg shadow-md w-full max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6">เพิ่มรายวิชา</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">รหัสวิชา</label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">ชื่อวิชา</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">ปีการศึกษา</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">ชื่อครู</label>
                <input
                  type="text"
                  name="teacherName"
                  value={formData.teacherName}
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
  