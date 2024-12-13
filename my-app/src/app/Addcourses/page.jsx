'use client';
import { useState ,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Ensure this is properly configured

const AdminPage = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    courses_id: '',
    namecourses: '',
    year: '',
    teacher: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter(); // Initialize useRouter

  // คำนวณปีจากปีปัจจุบันถึงย้อนหลัง 5 ปีและปีข้างหน้า 5 ปี
  const currentYear = new Date().getFullYear();  // ปี ค.ศ.
  const years = [];

  // ปีย้อนหลัง 5 ปี
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    const buddhistYear = i + 543;  // แปลงจากปี ค.ศ. เป็นปี พ.ศ.
    years.push(buddhistYear);
  }
  
  const [teachers, setTeachers] = useState([]); // ใช้สำหรับเก็บข้อมูลครูที่มี role เป็น "teacher"

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name')  // เลือกเฉพาะ id และ name ของครู
        .eq('role', 'teacher');  // กรองเฉพาะ role ที่เป็น 'teacher'
  
      if (error) {
        console.error("Error fetching teachers:", error);  // แสดงข้อผิดพลาดใน console
        setError('Failed to fetch teacher');  // ตั้งค่าข้อผิดพลาดให้กับ state
      } else {
        console.log("Fetched teacher:", data);  // แสดงข้อมูลที่ดึงมาจาก Supabase
        setTeachers(data);  // เก็บข้อมูลครูลงใน state
      }
    };
  
    fetchTeachers();  // เรียกใช้ฟังก์ชันดึงข้อมูล
  }, []);  // ทำงานแค่ครั้งเดียวเมื่อ component ถูกโหลด


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      console.log('Form data being submitted:', formData);  // เพิ่มการ log เพื่อตรวจสอบข้อมูล
      const { data, error } = await supabase.from('courses').insert([
        {
          courses_id: formData.courses_id,
          namecourses: formData.namecourses,
          year: formData.year, // In a real-world app, hash passwords before storing
          name_teacher: formData.name_teacher,
        },
      ]);

      if (error) {
        throw error;
      }

      setSuccess('Courses added successfully!');
      setFormData({
        courses_id: '',
        namecourses: '',
        year: '',
        name_teacher: '',
      });
    } catch (error) {
      setError(error.message);
    }
  };

  // New function for handling logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // Sign out using Supabase
    if (!error) {
      router.push('/login'); // Redirect to the login page
    } else {
      setError('Logout failed. Please try again.');
    }
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
            onClick={handleLogout} // Bind the logout function
            className="w-full py-2 px-4 bg-pink-400 hover:bg-pink-200 rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 flex justify-center items-center">
        <div className="bg-sky-50 p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-6">เพิ่มรายวิชา</h2>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {success && <div className="mb-4 text-green-500">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Courses ID</label>
              <input
                type="text"
                name="courses_id"
                value={formData.courses_id}
                onChange={handleInputChange}
                className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                required
                placeholder="กรุณากรอกข้อมูลเป็นตัวเลขเท่านั้น"  // ข้อความที่จางๆ จะปรากฏใน TextBox
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Namecourses</label>
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
              <label className="block text-gray-700">Year</label>
              <select
        name="year"
        value={formData.year}
        onChange={handleInputChange}
        className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        required
      >
        <option value="">เลือกปีการศึกษา</option>  {/* แสดงคำอธิบายให้ผู้ใช้เลือก */}
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
            <div className="mb-4">
              <label className="block text-gray-700">Teacher</label>
              <select
        name="name_teacher"
        value={formData.name_teacher}
        onChange={handleInputChange}
        className="mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        required
      >
        <option value="">เลือกครูผู้สอน</option> {/* ตัวเลือกเริ่มต้น */}
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.name}>
            {teacher.name} {/* แสดงชื่อครูที่ดึงมาจาก Supabase */}
          </option>
        ))}
      </select>
      {error && <div className="text-red-500 mt-2">{error}</div>} {/* แสดงข้อผิดพลาดหากมีการดึงข้อมูลผิดพลาด */}
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

export default AdminPage;
