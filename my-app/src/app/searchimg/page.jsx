'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ImageManagement() {
  const [images, setImages] = useState([]); // เก็บข้อมูลภาพทั้งหมด
  const [filteredImages, setFilteredImages] = useState([]); // เก็บข้อมูลภาพที่กรองแล้ว
  const [filterOption, setFilterOption] = useState('all'); // ตัวเลือกการกรอง
  const [error, setError] = useState(null); // เก็บข้อผิดพลาด
  const [userName, setUserName] = useState(''); // เก็บชื่อผู้ใช้
  const router = useRouter();

  // โหลดภาพเมื่อ Component ถูก mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')); // ดึงข้อมูลผู้ใช้จาก localStorage
    if (user) {
      setUserName(user.name); // ตั้งชื่อผู้ใช้
    } else {
      router.push('/login'); // ถ้าไม่มีผู้ใช้ ให้ไปที่หน้า login
    }

    fetchImages(); // ดึงข้อมูลภาพทั้งหมด
  }, [router]);

  // ฟังก์ชันดึงข้อมูลภาพจาก Supabase
  async function fetchImages() {
    try {
      const { data, error } = await supabase.storage
        .from('img_emotion')
        .list('', { limit: 100 }); // ดึงข้อมูลภาพจาก storage ทั้งหมด (ไม่ใช้ userId)

      if (error) throw new Error(error.message); // ถ้ามีข้อผิดพลาดให้แสดงข้อผิดพลาด

      // แปลงข้อมูลให้เป็น public URL
      const files = data
        .filter((item) => item.type === 'file') // กรองเฉพาะไฟล์
        .map((file) => {
          const filePath = file.name; // ใช้ชื่อไฟล์โดยตรง
          const publicUrl = supabase.storage
            .from('img_emotion')
            .getPublicUrl(filePath).data.publicUrl; // ดึง public URL ของไฟล์
          return {
            ...file,
            url: publicUrl, // เพิ่ม URL ของไฟล์เข้าไปในข้อมูล
          };
        });

      setImages(files); // ตั้งค่าภาพทั้งหมด
      setFilteredImages(files); // ตั้งค่าภาพที่กรองแล้ว
    } catch (err) {
      console.error('Error fetching images:', err.message);
      setError(err.message); // แสดงข้อผิดพลาด
    }
  }

  // ฟังก์ชันลบภาพ
  async function deleteImage(filePath) {
    if (confirm(`คุณต้องการลบภาพนี้: ${filePath}?`)) { // ถามผู้ใช้ว่าแน่ใจหรือไม่
      try {
        const { error } = await supabase.storage
          .from('img_emotion')
          .remove([filePath]); // ลบไฟล์จาก storage

        if (error) throw new Error(error.message); // ถ้ามีข้อผิดพลาดให้แสดงข้อผิดพลาด

        console.log(`Image deleted: ${filePath}`);
        fetchImages(); // รีเฟรชภาพหลังจากลบ
      } catch (err) {
        console.error('Error deleting image:', err.message);
        setError(err.message); // แสดงข้อผิดพลาด
      }
    }
  }

  // ฟังก์ชันกรองภาพตามวันที่
  function filterImagesByDate(option) {
    const now = new Date(); // วันปัจจุบัน
    let filtered = images;

    switch (option) {
      case 'today': // กรองเฉพาะภาพที่อัปโหลดวันนี้
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.toDateString() === now.toDateString();
        });
        break;

      case 'last7days': // กรองภาพใน 7 วันที่ผ่านมา
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7); // คำนวณวัน 7 วันที่แล้ว
          return fileDate >= sevenDaysAgo;
        });
        break;

      case 'last30days': // กรองภาพใน 30 วันที่ผ่านมา
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30); // คำนวณวัน 30 วันที่แล้ว
          return fileDate >= thirtyDaysAgo;
        });
        break;

      case 'thisYear': // กรองภาพในปีนี้
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.getFullYear() === now.getFullYear();
        });
        break;

      case 'lastYear': // กรองภาพในปีที่แล้ว
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.getFullYear() === now.getFullYear() - 1;
        });
        break;

      default: // ถ้าไม่ได้เลือกอะไร กรองทุกภาพ
        filtered = images;
        break;
    }

    setFilteredImages(filtered); // ตั้งค่าภาพที่กรองแล้ว
  }

  const handleLogout = () => {
    localStorage.removeItem('user'); // ลบข้อมูลผู้ใช้ใน localStorage
    router.push('/login'); // ไปที่หน้า login
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
              setFilterOption(e.target.value); // อัปเดตตัวเลือกการกรอง
              filterImagesByDate(e.target.value); // กรองภาพตามตัวเลือก
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
                onClick={() => deleteImage(image.name)} // ลบภาพ
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
