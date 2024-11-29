'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const EditCourse = ({ courseId }) => {
  const [formData, setFormData] = useState({
    year: '',
    namecourses: '',
    name_teacher: ''
  });

  const router = useRouter(); // Use useRouter for navigation

  // Fetch the course data when the component mounts
  const fetchCourseData = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('courses_id', courseId)
        .single();

      if (error) throw error;

      // Populate the form with the fetched data
      setFormData({
        year: data.year || '',
        namecourses: data.namecourses || '',
        name_teacher: data.name_teacher || ''
      });
    } catch (err) {
      console.error('Error fetching course data:', err.message);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

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
      const { data, error } = await supabase
        .from('courses')
        .update({
          year: formData.year,
          namecourses: formData.namecourses,
          name_teacher: formData.name_teacher
        })
        .eq('courses_id', courseId);

      if (error) {
        console.error('Error updating course data:', error.message);
      } else {
        console.log('Course updated successfully:', data);
        router.push('/dashboard'); // Redirect to a dashboard or course list after updating
      }
    } catch (err) {
      console.error('Unexpected error:', err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error.message);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Unexpected logout error:', err.message);
    }
  };

  const handleBack = () => {
    router.back(); // Navigate back to the previous page
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
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-6 left-10 py-2 px-4 bg-gray-400 hover:bg-gray-300 text-white rounded-lg"
        >
          ย้อนกลับ
        </button>

        {/* Edit Course Form */}
        <div className="bg-sky-50 p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-6">แก้ไขข้อมูลรายวิชา</h2>
          <form onSubmit={handleSubmit}>
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
              <label className="block text-gray-700">ชื่ออาจารย์</label>
              <input
                type="text"
                name="name_teacher"
                value={formData.name_teacher}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-pink-400 hover:bg-pink-200 text-white rounded-lg"
            >
              อัปเดตข้อมูลรายวิชา
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;
