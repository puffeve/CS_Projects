'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Ensure this is properly configured

// Sidebar Component
const Sidebar = ({ userName, onLogout }) => {
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
};

const AdminPage = () => {
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUserName(storedUser.name);
    } else {
      router.push('/login');
    }
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
      const { data, error } = await supabase.from('users').insert([
        {
          name: formData.name,
          email: formData.email,
          password: formData.password, // In a real-world app, hash passwords before storing
          phone: formData.phone,
          role: formData.role,
        },
      ]);

      if (error) {
        throw error;
      }

      setSuccess('User added successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'student',
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
    <div className="flex">
      {/* Sidebar */}
      <Sidebar userName={userName} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 p-10 flex justify-center items-center">
        <div className="bg-sky-50 p-12 rounded-lg shadow-md w-full max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">เพิ่มบัญชีผู้ใช้</h2>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {success && <div className="mb-4 text-green-500">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">ชื่อผู้ใช้</label>
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
              <label className="block text-gray-700">Email</label>
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
                placeholder="กรุณากรอกข้อมูลเป็นตัวเลขเท่านั้น"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">บทบาท</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="teacher">อาจารย์ผู้สอน</option>
                <option value="student">ผู้เรียน</option>
                <option value="admin">ผู้ดูแลระบบ</option>
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

export default AdminPage;
