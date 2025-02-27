"use client"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase'; 
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ResultPage = ({ handleSignOut }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userName, setUserName] = useState("");
  const [timestamps, setTimestamps] = useState([]);
  const [emotionData, setEmotionData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const router = useRouter();

  // โหลดข้อมูลจาก LocalStorage
  useEffect(() => {
    const storedCourse = localStorage.getItem("selectedCourse");
    const storedUserName = localStorage.getItem("userName");

    if (storedCourse) {
      const parsedCourse = JSON.parse(storedCourse);
      setSelectedCourse(parsedCourse);
      console.log("Selected Course:", parsedCourse);
    } else {
      router.push("/teacher_dashboard");
    }

    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      router.push("/teacher_dashboard");
    }
  }, [router]);

  const convertToBuddhistYear = (date) => {
    const year = date.getFullYear();
    return year + 543;
  };
  
  const formatDate = (dateInput) => {
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateInput);
        return 'Invalid Date';
      }

      const buddhistYear = convertToBuddhistYear(date);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = new Intl.DateTimeFormat('th-TH', options).format(date);
      return `${formattedDate} พ.ศ. ${buddhistYear}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const convertToLocalTime = (timestamp) => {
    const date = new Date(timestamp);
    const localTime = date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    return localTime;
  };

  // โหลด timestamps เมื่อ selectedCourse ถูกตั้งค่าแล้ว
  useEffect(() => {
    if (selectedCourse) {
      fetchTimestamps();
    }
  }, [selectedCourse]);

  // ดึง timestamps จาก Supabase และจัดกลุ่มตามวันที่
  const fetchTimestamps = async () => {
    if (!selectedCourse) return;

    try {
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("detection_time")
        .eq("courses_id", selectedCourse.courses_id);

      if (error) throw error;

      const sortedTimestamps = data.sort((a, b) => new Date(a.detection_time) - new Date(b.detection_time));
      const groupedTimestamps = groupTimestampsByDate(sortedTimestamps);
      setTimestamps(groupedTimestamps);
    } catch (error) {
      console.error("Error fetching timestamps:", error.message);
    }
  };

  // จัดกลุ่ม timestamp ตามวัน
  const groupTimestampsByDate = (timestamps) => {
    const grouped = {};

    timestamps.forEach((item) => {
      try {
        const date = new Date(item.detection_time);
        
        if (isNaN(date.getTime())) {
          console.error('Invalid timestamp:', item);
          return;
        }

        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

        if (!grouped[dateString]) {
          grouped[dateString] = [];
        }
        grouped[dateString].push(date.toISOString());
      } catch (error) {
        console.error('Error processing timestamp:', error);
      }
    });

    return Object.keys(grouped).map((date) => ({
      date,
      timestamps: grouped[date],
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // ดึงข้อมูล percentage จาก Supabase และคำนวณค่าเฉลี่ยของแต่ละอารมณ์
  const fetchEmotionData = async (time) => {
    if (!selectedCourse || !time) return;
  
    try {
      const startOfDay = new Date(time);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1);
  
      const startOfDayISO = startOfDay.toISOString();
      const endOfDayISO = endOfDay.toISOString();
  
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("emotion, detection_time")
        .eq("courses_id", selectedCourse.courses_id)
        .gte("detection_time", startOfDayISO)
        .lt("detection_time", endOfDayISO);
  
      if (error) throw error;
  
      const emotions = {
        Happiness: 0,
        Sadness: 0,
        Anger: 0,
        Fear: 0,
        Surprise: 0,
        Neutral: 0,
        Disgusted: 0,
      };
  
      data.forEach((item) => {
        if (emotions.hasOwnProperty(item.emotion)) {
          emotions[item.emotion] += 1;
        }
      });
  
      const total = data.length;
      if (total > 0) {
        for (const key in emotions) {
          emotions[key] = emotions[key] / total;
        }
      }
  
      console.log('Emotion Data:', emotions);
      console.log('Total records:', total);
      console.log('Raw Data:', data);
  
      setEmotionData(emotions);
      setSelectedTime(time);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching emotion data:", error.message);
    }
  };
  
  // ปิดป๊อปอัพ
  const closeModal = () => {
    setShowModal(false);
  };

  if (!selectedCourse) {
    return <p className="text-center mt-10 text-xl">กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-sky-200 text-black p-4 relative flex flex-col">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-[#305065] mb-6" />
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
          <button onClick={() => router.back()} className="w-full bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-md text-white mt-4">
            ย้อนกลับ
          </button>
        </div>
        <div className="sticky bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full py-2 px-4 bg-pink-400  active:bg-[#1d2f3f] text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          ตอนนี้อยู่ในวิชา {selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})
        </h2>
        <p className="text-lg">ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}</p>
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold mb-3">เลือกวัน/เวลาที่ต้องการดูผลวิเคราะห์</h3>
          {timestamps.length > 0 ? (
            timestamps.map((group, index) => (
              <div key={index} className="space-y-2">
                <p className="text-lg font-semibold text-gray-700">{formatDate(new Date(group.date))}</p>
                <button
                  onClick={() => fetchEmotionData(group.date)}
                  className="block w-full bg-gradient-to-r from-sky-300 to-pink-300 text-black py-3 px-6 rounded-lg shadow-lg hover:from-sky-300 hover:to-pink-300 transition duration-300"
                >
                  {convertToLocalTime(group.date)}
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">ไม่มีข้อมูลเวลาที่บันทึก</p>
          )}
        </div>
      </div>

      {showModal && emotionData && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full relative">
            <h3 className="text-2xl font-semibold mb-4">กราฟแสดงผลอารมณ์ ณ เวลา {convertToLocalTime(selectedTime)}</h3>
            
            <Pie
              data={{
                labels: ["Happiness", "Sadness", "Anger", "Fear", "Surprise", "Neutral", "Disgusted"],
                datasets: [{
                  data: [
                    emotionData.Happiness * 100,
                    emotionData.Sadness * 100,
                    emotionData.Anger * 100,
                    emotionData.Fear * 100,
                    emotionData.Surprise * 100,
                    emotionData.Neutral * 100,
                    emotionData.Disgusted * 100,
                  ],
                  backgroundColor: ["#ffea00", "#0c0047", "#ff0026", "#000000", "#8A2BE2", "#616161", "#2edb02"],
                }],
              }}
              options={{
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.label}: ${context.raw.toFixed(2)}%`,
                    },
                  },
                },
              }}
            />
            <button
              onClick={closeModal}
              className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;