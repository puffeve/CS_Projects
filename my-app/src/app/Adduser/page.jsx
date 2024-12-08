'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AddUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student' // ค่าเริ่มต้นเป็น 'student'
  });

  const router = useRouter(); // ใช้ useRouter สำหรับการนำทาง

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
      const { data, error } = await supabase.from('users').insert([{
        name: formData.name,
        email: formData.email,
        password: formData.password, // ควรใช้การเข้ารหัสรหัสผ่านในแอปจริง
        phone: formData.phone,
        role: formData.role
      }]);

      if (error) {
        console.error('เกิดข้อผิดพลาดในการแทรกข้อมูล:', error.message);
      } else {
        console.log('แทรกข้อมูลสำเร็จ:', data);
        setFormData({ name: '', email: '', password: '', phone: '', role: 'student' });
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

        {/* ฟอร์มสำหรับเพิ่มบัญชีผู้ใช้ */}
        <div className="bg-sky-50 p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-6">เพิ่มบัญชีผู้ใช้</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">ชื่อ</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">อีเมล</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">รหัสผ่าน</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">เบอร์โทรศัพท์</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">ประเภทผู้ใช้</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-pink-400 hover:bg-pink-200 text-white rounded-lg"
            >
              เพิ่มบัญชีผู้ใช้
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
