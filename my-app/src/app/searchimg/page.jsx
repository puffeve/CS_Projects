'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // ใช้ useRouter เพื่อทำการ redirect ไปหน้า login
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

    fetchImages(); // เรียกฟังก์ชัน fetchImages เพื่อดึงข้อมูลภาพจาก Supabase
  }, [router]); // ใส่ router ใน dependencies เพื่อให้แน่ใจว่าใช้ข้อมูล router ที่ถูกต้อง

  // ฟังก์ชันดึงข้อมูลภาพจาก Supabase
  async function fetchImages() {
    try {
      const { data, error } = await supabase.storage.from('img_emotion').list('', {
        limit: 100, // กำหนดจำนวนไฟล์ที่ต้องการดึงมา
      });

      if (error) throw new Error(error.message); // หากเกิดข้อผิดพลาดให้แสดงข้อผิดพลาด

      // ตรวจสอบว่ามีข้อมูลไฟล์จริงหรือไม่
      console.log('Fetched Images:', data);

      const files = data
        .filter((item) => item.type === 'file') // กรองเฉพาะไฟล์
        .map((file) => {
          // สร้าง URL ตาม path ที่เก็บไฟล์
          const filePath = file.name; // ชื่อไฟล์จะต้องเป็น ${userId}/${emotion}-${timestamp}.jpg
          const publicUrl = supabase.storage.from('img_emotion').getPublicUrl(filePath).data.publicUrl;
          console.log('Public URL:', publicUrl);  // ตรวจสอบ URL ที่ได้
          return {
            ...file, // ส่งข้อมูลไฟล์ทั้งหมด
            url: publicUrl, // เพิ่ม URL ที่สามารถเข้าถึงภาพได้
          };
        });

      setImages(files); // กำหนดภาพทั้งหมดให้ state images
      setFilteredImages(files); // กำหนดภาพเริ่มต้นสำหรับการกรอง
    } catch (err) {
      console.error('Error fetching images:', err.message);
      setError(err.message); // ถ้ามีข้อผิดพลาด ให้แสดงข้อความข้อผิดพลาด
    }
  }

  // ฟังก์ชันลบภาพ
  async function deleteImage(fileName) {
    if (confirm(`คุณต้องการลบภาพนี้: ${fileName}?`)) { // ถามยืนยันการลบภาพ
      try {
        const { error } = await supabase.storage.from('img_emotion').remove([fileName]);

        if (error) throw new Error(error.message); // หากเกิดข้อผิดพลาดให้แสดงข้อผิดพลาด

        console.log(`Image deleted: ${fileName}`);
        fetchImages(); // โหลดภาพใหม่หลังจากลบภาพ
      } catch (err) {
        console.error('Error deleting image:', err.message);
        setError(err.message); // ถ้ามีข้อผิดพลาด ให้แสดงข้อความข้อผิดพลาด
      }
    }
  }

  // ฟังก์ชันกรองภาพตามวันที่
  function filterImagesByDate(option) {
    const now = new Date(); // วันที่ปัจจุบัน
    let filtered = images; // กรองภาพจาก images ทั้งหมด

    switch (option) {
      case 'today':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at); // ใช้วันที่ที่สร้างหรืออัปเดตไฟล์
          return fileDate.toDateString() === now.toDateString(); // กรองเฉพาะภาพที่สร้างวันนี้
        });
        break;

      case 'last7days':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7); // วันที่ 7 วันที่แล้ว
          return fileDate >= sevenDaysAgo; // กรองภาพในช่วง 7 วันที่ผ่านมา
        });
        break;

      case 'last30days':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30); // วันที่ 30 วันที่แล้ว
          return fileDate >= thirtyDaysAgo; // กรองภาพในช่วง 30 วันที่ผ่านมา
        });
        break;

      case 'thisYear':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.getFullYear() === now.getFullYear(); // กรองภาพที่สร้างในปีนี้
        });
        break;

      case 'lastYear':
        filtered = images.filter((image) => {
          const fileDate = new Date(image.created_at || image.updated_at);
          return fileDate.getFullYear() === now.getFullYear() - 1; // กรองภาพที่สร้างในปีที่แล้ว
        });
        break;

      default:
        filtered = images; // หากไม่ได้เลือกตัวกรอง ให้แสดงภาพทั้งหมด
        break;
    }

    setFilteredImages(filtered); // กำหนดภาพที่ผ่านการกรองแล้ว
  }

  const handleLogout = () => {
    // ลบข้อมูลผู้ใช้จาก localStorage และ redirect ไปหน้า login
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
              filterImagesByDate(e.target.value); // เรียกฟังก์ชันกรองภาพ
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
