'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TeacherDashboard = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const router = useRouter();

  // ข้อมูลรายวิชาคงที่ ทดลองไว้
  const courses = [
    { id: 1, name: "วิชาคณิตศาสตร์" },
    { id: 2, name: "วิชาวิทยาศาสตร์" },
    { id: 3, name: "วิชาภาษาอังกฤษ" },
  ];

  const handleAnalyzeClick = () => {
    if (!selectedCourse) {
      alert("กรุณาเลือกวิชาก่อน");
      return;
    }
    // เปลี่ยนไปที่หน้าเพจวิเคราะห์ใบหน้า
    router.push(`/analyze/${selectedCourse.id}`);
  };

  const handleCompareClick = () => {
    if (!selectedCourse) {
      alert("กรุณาเลือกวิชาก่อน");
      return;
    }
    // เปลี่ยนไปที่หน้าเพจเปรียบเทียบผลวิเคราะห์
    router.push(`/compare/${selectedCourse.id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold">เลือกวิชาสำหรับการวิเคราะห์</h1>
      <div className="my-4">
        <label htmlFor="course" className="block text-lg font-medium">เลือกวิชา:</label>
        <select
          id="course"
          className="mt-2 block w-full px-4 py-2 border rounded-lg"
          onChange={(e) => setSelectedCourse(courses.find(course => course.id === Number(e.target.value)))}
        >
          <option value="">เลือกวิชา</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <div className="mt-6">
          <button
            onClick={handleAnalyzeClick}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-4"
          >
            วิเคราะห์ใบหน้า
          </button>
          <button
            onClick={handleCompareClick}
            className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            เปรียบเทียบผลวิเคราะห์
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
