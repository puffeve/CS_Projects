"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase'; 
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { usePathname } from "next/navigation";

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const CompareResultPage = ({ handleSignOut }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userName, setUserName] = useState("");
  const [timestamps, setTimestamps] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [emotionData, setEmotionData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userCourses, setUserCourses] = useState([]); // Added state for courses
  const router = useRouter();

  useEffect(() => {
    console.log("Current Path:", router.pathname);
  }, [router.pathname]);

  const pathname = usePathname();
  console.log("Current Path:", pathname);
  const isResultPage = pathname === "/compare_result";  // ตรวจสอบว่าตรงกับ path "/result" หรือไม่
  
  useEffect(() => {
    const storedCourse = localStorage.getItem("selectedCourse");
    const storedUserName = localStorage.getItem("userName");
  
    if (storedCourse) {
      setSelectedCourse(JSON.parse(storedCourse));
    } else {
      router.push("/teacher_dashboard");
    }
  
    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      router.push("/teacher_dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (selectedCourse) {
      fetchTimestamps();
    }
  }, [selectedCourse]);

  const fetchUserCourses = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId);  // ดึงข้อมูลวิชาที่ผู้ใช้มีสิทธิ์จาก user_id
  
      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setUserCourses(data);  // เก็บข้อมูลวิชาใน state
      }
    } catch (error) {
      console.error("Error fetching user courses:", error.message);
    }
  };

  const convertToBuddhistYear = (date) => {
    const year = date.getFullYear();
    return year + 543; // เปลี่ยนจาก ค.ศ. เป็น พ.ศ.
  };

  const fetchTimestamps = async () => {
    if (!selectedCourse) return;
    try {
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("detection_time")
        .eq("courses_id", selectedCourse.courses_id);

      if (error) throw error;

      const groupedTimestamps = [...new Set(data.map(item => item.detection_time.split('T')[0]))];
      setTimestamps(groupedTimestamps);
    } catch (error) {
      console.error("Error fetching timestamps:", error.message);
    }
  };

  const fetchEmotionData = async () => {
    if (selectedDates.length !== 2) return;
    
    try {
      const dataPromises = selectedDates.map(async (date) => {
        const { data, error } = await supabase
          .from("emotion_detection")
          .select("emotion")
          .eq("courses_id", selectedCourse.courses_id)
          .gte("detection_time", `${date}T00:00:00`)
          .lt("detection_time", `${date}T23:59:59`);

        if (error) throw error;
        
        const emotions = {
          Happiness: 0, Sadness: 0, Anger: 0, Fear: 0, Surprise: 0, Neutral: 0, Disgusted: 0
        };
        data.forEach((item) => {
          if (item.emotion in emotions) {
            emotions[item.emotion] += 1;
          }
        });

        const total = data.length;
        if (total > 0) {
          for (const key in emotions) {
            emotions[key] = (emotions[key] / total) * 100;
          }
        }
        return { date, emotions };
      });
      
      const result = await Promise.all(dataPromises);
      setEmotionData(result);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching emotion data:", error.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleCourseChange = (event) => {
    const selectedCourse = userCourses.find(course => course.courses_id === event.target.value);
    setSelectedCourse(selectedCourse);  // เก็บข้อมูลวิชาที่เลือก
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-sky-200 text-black p-4 relative flex flex-col">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-[#305065] mb-6" />
        {/* เมนูการทำรายการ */}
        <div className="flex-1 flex flex-col items-start space-y-2">
          <button onClick={() => router.push("/analyze_face")} className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md ">
            วิเคราะห์ใบหน้า
          </button>
          <button onClick={() => router.push("/result")} className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md">
            ผลวิเคราะห์
          </button>
          <button onClick={() => router.push("/compare_result")} className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md ">
            เปรียบเทียบผลวิเคราะห์
          </button>
          <button onClick={() => router.push("/Teacher_dashboard")} className="w-full bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-md text-white mt-4">
            ย้อนกลับ
          </button>
        </div>
        {/* ปุ่มออกจากระบบ */}
        <div className="sticky bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full py-2 px-4 bg-pink-400  active:bg-[#1d2f3f] text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      
      {/* เนื้อหาหลัก */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedCourse ? (  // ตรวจสอบว่า selectedCourse มีค่าหรือยัง
          <h2 className="text-2xl font-bold mb-4">
            ตอนนี้อยู่ในวิชา {selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})
          </h2>
        ) : (
          <h2 className="text-2xl font-bold mb-4">กำลังโหลดข้อมูลวิชา...</h2>  // หากยังไม่มีข้อมูลจะแสดงข้อความนี้
        )}
        {selectedCourse && (
          <p className="text-lg">ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}</p>
        )}

        {/* เพิ่มข้อความที่ต้องการแสดง */}
        {isResultPage && (
          <h3 className="text-xl mt-4 mb-4">
            <span className="bg-pink-200 px-2 py-1 rounded">
              ตอนนี้อยู่ในหน้าเปรียบเทียบผลวิเคราะห์
            </span>
          </h3>
        )}
        
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold mb-3">เปรียบเทียบในรายวิชาเดียวกัน</h3>
          <h2 className="text-xl mb-3">กรุณาเลือกวันที่ 2 วันเพื่อทำการเปรียบเทียบผลการวิเคราะห์</h2>
          <div className="grid grid-cols-3 gap-4">
            {timestamps.map((date, index) => (
              <button 
                key={index}
                onClick={() => setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev.slice(-1), date])}
                className={`p-3 rounded-lg ${selectedDates.includes(date) ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
              >
                {date}
              </button>
            ))}
          </div>

          {/* แสดงผลเปรียบเทียบ และ เลือกวิชาที่ต้องการเปรียบเทียบ */}
          <div className="mt-4">
            <button 
              onClick={fetchEmotionData} 
              className="bg-green-500 text-white py-2 px-4 rounded-lg "
            >
              แสดงผลเปรียบเทียบ
            </button>
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-3">เลือกวิชาที่ต้องการเปรียบเทียบ</h3>
              <select
                className="p-2 border border-gray-300 rounded-lg"
                value={selectedCourse?.courses_id || ""}
                onChange={handleCourseChange}
              >
                <option value="" disabled>เลือกวิชา</option>
                {userCourses.map((course) => (
                  <option key={course.courses_id} value={course.courses_id}>
                    {course.courses_id} {/* แสดงแค่ courses_id */}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {showModal && emotionData && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full relative">
            <h3 className="text-2xl font-semibold mb-4">กราฟเปรียบเทียบผลการวิเคราะห์อารมณ์ในช่วงเวลาที่เลือก</h3>
            <Bar 
              data={{
                labels: ["Happiness", "Sadness", "Anger", "Fear", "Surprise", "Neutral", "Disgusted"],
                datasets: emotionData.map((data, index) => ({
                  label: data.date,
                  data: Object.values(data.emotions),
                  backgroundColor: index === 0 ? "#ff6384" : "#36a2eb",
                }))
              }}
            />
            <button onClick={closeModal} className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareResultPage;
