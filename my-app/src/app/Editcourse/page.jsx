'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Sidebar Component
function Sidebar({ onLogout }) {
  return (
    <div className="flex flex-col h-screen w-64 bg-sky-200 text-black">
      <div className="p-4 text-lg font-bold border-b border-gray-700">
        ClassMood Insight
      </div>
      <div className="flex-grow p-4">
      </div>
      <button
        onClick={onLogout}
        className="mb-4 mx-4 px-4 py-2 bg-pink-400 hover:bg-pink-200 rounded-md text-center"
      >
        Log out
      </button>
    </div>
  );
}

// Edit Course Page
export default function EditCourse() {
  const [course, setCourse] = useState(null); // Store the course data
  const [formData, setFormData] = useState({
    courses_id: '',
    year: '',
    namecourses: '',
    name_teacher: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id'); // Get course ID from query params

  // Fetch course data by ID
  const fetchCourseData = async () => {
    const { data: courseData, error } = await supabase
      .from('courses')
      .select('*')
      .eq('courses_id', courseid)
      .single();

    if (courseData) {
      setCourse(courseData);
      setFormData({
        courses_id: courseData.courses_id,
        year: courseData.year,
        namecourses: courseData.namecourses,
        name_teacher: courseData.name_teacher,
      });
    }

    if (error) console.error('Error fetching course data:', error);
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('courses')
      .update({
        year: formData.year,
        namecourses: formData.namecourses,
        name_teacher: formData.name_teacher,
      })
      .eq('courses_id', courseId);

    if (error) {
      console.error('Error updating course data:', error);
      alert('Error saving changes.');
    } else {
      alert('Changes saved successfully!');
      router.push('/searchcourse'); // Redirect to course management page
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    }
  };

  return (
    <div className="flex">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-grow p-8">
        <h1 className="text-2xl font-bold mb-4">Edit Course</h1>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Course ID</label>
            <input
              type="text"
              name="courses_id"
              value={formData.courses_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md "
              
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Name</label>
            <input
              type="text"
              name="namecourses"
              value={formData.namecourses}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teacher Name</label>
            <input
              type="text"
              name="name_teacher"
              value={formData.name_teacher}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 
