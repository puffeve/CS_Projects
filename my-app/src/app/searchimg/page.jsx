'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';  // ใช้ useRouter เพื่อทำการ redirect
import { supabase } from '@/lib/supabase';

export default function ImageManagement() {
  const [images, setImages] = useState([]); // เก็บข้อมูลภาพทั้งหมด
  const [filteredImages, setFilteredImages] = useState([]); // เก็บข้อมูลภาพหลังการกรอง
  const [filterOption, setFilterOption] = useState('all'); // ตัวเลือกการกรอง
  const [error, setError] = useState(null); // เก็บข้อความข้อผิดพลาด
  const [userName, setUserName] = useState(''); // เพิ่ม state สำหรับชื่อผู้ใช้งาน
  const router = useRouter(); // ใช้ router เพื่อ redirect ไปหน้า login

  // โหลดภาพเมื่อ Component ถูก mount
  useEffect(() => {
    // ตรวจสอบข้อมูลผู้ใช้ใน localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserName(user.name); // ตั้งชื่อผู้ใช้จากข้อมูลใน localStorage
    } else {
      router.push('/login'); // หากไม่มีข้อมูลผู้ใช้ ให้กลับไปหน้า login
    }

    fetchImages();
  }, [router]); // ใส่ router ใน dependencies เพื่อให้แน่ใจว่าใช้ข้อมูล router ที่ถูกต้อง

  // ดึงข้อมูลภาพจาก Supabase
  async function fetchImages() {
    try {
      const { data, error } = await supabase.storage.from('img_emotion').list('', {
        limit: 100,
      });

      if (error) throw new Error(error.message);

      const files = data
        .filter((item) => item.type === 'file')
        .map((file) => ({
          ...file,
          url: supabase.storage.from('img_emotion').getPublicUrl(file.name).data.publicUrl,
        }));

      setImages(files);
      setFilteredImages(files); // กำหนดภาพเริ่มต้นสำหรับการกรอง
    } catch (err) {
      console.error('Error fetching images:', err.message);
      setError(err.message);
    }
  }

  // ฟังก์ชันลบภาพ
  async function deleteImage(fileName) {
    if (confirm(`คุณต้องการลบภาพนี้: ${fileName}?`)) {
      try {
        const { error } = await supabase.storage.from('img_emotion').remove([fileName]);

        if (error) throw new Error(error.message);

        console.log(`Image deleted: ${fileName}`);
        fetchImages(); // โหลดภาพใหม่หลังจากลบ
      } catch (err) {
        console.error('Error deleting image:', err.message);
        setError(err.message);
      }
    }
  }

  // ฟังก์ชันกรองภาพตามวันที่
  function filterImagesByDate(option) {
    const now = new Date();
    let filtered = images;

    switch (option) {
      case 'today':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.toDateString() === now.toDateString();
        });
        break;

      case 'last7days':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return fileDate >= sevenDaysAgo;
        });
        break;

      case 'last30days':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return fileDate >= thirtyDaysAgo;
        });
        break;

      case 'thisYear':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.getFullYear() === now.getFullYear();
        });
        break;

      case 'lastYear':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.getFullYear() === now.getFullYear() - 1;
        });
        break;

      default:
        filtered = images;
        break;
    }

    setFilteredImages(filtered);
  }

  const handleLogout = () => {
    // Clear user data from localStorage and redirect to login page
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar ซ้าย */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
          {userName && <p className="text-lg font-semibold mb-6">สวัสดี {userName}</p>}
          <hr className="border-sky-300 mb-6" />
          <nav>
          <a href="/searchacc" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลบัญชี</a>
          <a href="/searchcourse" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลรายวิชา</a>
          <a href="/searchimg" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลใบหน้า</a>
        </nav>
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 py-2 px-4 rounded-lg mt-auto hover:bg-pink-200 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Content หลัก */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">จัดการข้อมูลใบหน้า</h1>

        {/* แสดงข้อผิดพลาด */}
        {error && <p className="text-red-500">Error: {error}</p>}

        {/* ตัวเลือกการกรอง */}
        <div className="mb-4">
          <label htmlFor="filter" className="mr-2">กรองตามวันที่:</label>
          <select
            id="filter"
            value={filterOption}
            onChange={(e) => {
              setFilterOption(e.target.value);
              filterImagesByDate(e.target.value);
            }}
            className="border rounded px-4 py-2"
          >
            <option value="all">ทั้งหมด</option>
            <option value="today">วันนี้</option>
            <option value="last7days">7 วันที่แล้ว</option>
            <option value="last30days">30 วันที่แล้ว</option>
            <option value="thisYear">ปีนี้</option>
            <option value="lastYear">ปีที่แล้ว</option>
          </select>
        </div>

        {/* แสดงภาพ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((image) => (
            <div key={image.name} className="border p-4 rounded shadow">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-48 object-cover mb-2 rounded"
              />
              <p className="font-semibold">{image.name}</p>
              <p className="text-gray-600">
                วันที่อัปเดต: {new Date(image.updated_at || image.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => deleteImage(image.name)}
                className="bg-red-500 text-white px-4 py-2 mt-2 rounded"
              >
                ลบภาพ
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}