'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AdminDashboard = () => {
  const router = useRouter();

  // ฟังก์ชันสำหรับการนำทางไปยังหน้าที่แตกต่างกัน
  const navigateTo = (path) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigateTo('/searchacc')}
            className="w-full bg-pink-400 text-white py-4 rounded-lg hover:bg-pink-300 transition"
          >
            จัดการข้อมูลบัญชี
          </button>
          
          <button
            onClick={() => navigateTo('/searchcourse')}
            className="w-full bg-sky-400 text-white py-4 rounded-lg hover:bg-sky-300 transition"
          >
            จัดการข้อมูลรายวิชา
          </button>
          
          <button
            onClick={() => navigateTo('/admin/manage-face-data')}
            className="w-full bg-purple-400 text-white py-4 rounded-lg hover:bg-purple-300 transition"
          >
            จัดการข้อมูลใบหน้า
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
