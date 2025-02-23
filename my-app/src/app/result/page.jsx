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
  const [showModal, setShowModal] = useState(false); // State for showing the modal
  const [selectedTime, setSelectedTime] = useState(null);
  const router = useRouter();

  // ✅ โหลดข้อมูลจาก LocalStorage
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

  const convertToBuddhistYear = (date) => {
    const year = date.getFullYear();
    return year + 543; // เปลี่ยนจาก ค.ศ. เป็น พ.ศ.
  };
  
  const formatDate = (date) => {
    const buddhistYear = convertToBuddhistYear(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('th-TH', options).format(date);
    return `${formattedDate} พ.ศ. ${buddhistYear}`;
  };

  // ✅ แปลงเวลาเป็นเวลาท้องถิ่นของไทย (Asia/Bangkok)
  const convertToLocalTime = (timestamp) => {
    const date = new Date(timestamp);
    const localTime = date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    return localTime;
  };

  // ✅ โหลด timestamps เมื่อ selectedCourse ถูกตั้งค่าแล้ว
  useEffect(() => {
    if (selectedCourse) {
      fetchTimestamps();
    }
  }, [selectedCourse]);

  // ✅ ดึง timestamps จาก Supabase และจัดกลุ่มตามวันที่
  const fetchTimestamps = async () => {
    if (!selectedCourse) return;

    try {
      const { data, error } = await supabase
        .from("emotiondata")
        .select("timestamp")
        .eq("courses_id", selectedCourse.courses_id); // ✅ กรองเฉพาะ courses_id ที่เลือก

      if (error) throw error;

      // ✅ เรียงลำดับ timestamp ตามวันที่ก่อน
      const sortedTimestamps = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // ✅ เอา timestamp ที่ไม่ซ้ำกัน และจัดกลุ่มตามวัน
      const groupedTimestamps = groupTimestampsByDate(sortedTimestamps);
      setTimestamps(groupedTimestamps);
    } catch (error) {
      console.error("Error fetching timestamps:", error.message);
    }
  };

  // ✅ ฟังก์ชันในการจัดกลุ่ม timestamp ตามวัน
  const groupTimestampsByDate = (timestamps) => {
    const grouped = {};

    timestamps.forEach((item) => {
      const date = new Date(item.timestamp);
      const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

      if (!grouped[dateString]) {
        grouped[dateString] = [];
      }
      grouped[dateString].push(item.timestamp);
    });

    return Object.keys(grouped).map((date) => ({
      date,
      timestamps: grouped[date],
    }));
  };

  // ✅ ฟังก์ชันดึงข้อมูล percentage จาก Supabase และคำนวณค่าเฉลี่ยของแต่ละอารมณ์
  const fetchEmotionData = async (time) => {
    if (!selectedCourse || !time) return;
  
    try {
      const startOfDay = new Date(time); // เวลาที่เริ่มต้นในวันนั้น
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1); // เวลาสิ้นสุดในวันถัดไป
  
      const startOfDayISO = startOfDay.toISOString();
      const endOfDayISO = endOfDay.toISOString();
  
      const { data, error } = await supabase
        .from("emotiondata")
        .select("emotion, timestamp")
        .eq("courses_id", selectedCourse.courses_id)
        .gte("timestamp", startOfDayISO)
        .lt("timestamp", endOfDayISO);
  
      if (error) throw error;
  
      const emotions = {
        happiness: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        neutral: 0,
        disgusted: 0,
      };
  
      data.forEach((item) => {
        if (item.emotion === 'happy') {
          emotions.happiness += 1;
        } else if (item.emotion === 'sad') {
          emotions.sadness += 1;
        } else if (item.emotion === 'angry') {
          emotions.anger += 1;
        } else if (item.emotion === 'fear') {
          emotions.fear += 1;
        } else if (item.emotion === 'surprise') {
          emotions.surprise += 1;
        }
        else if (item.emotion === 'neutral') {
          emotions.neutral += 1;
        }
        else if (item.emotion === 'disgusted') {
          emotions.disgusted += 1;
        }
      });
  
      const total = data.length;
      if (total > 0) {
        for (const key in emotions) {
          emotions[key] = emotions[key] / total; // คำนวณค่าเฉลี่ย
        }
      }
  
      setEmotionData(emotions);
      setSelectedTime(time);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching emotion data:", error.message);
    }
  };
  
  // ฟังก์ชันสำหรับปิดป๊อปอัพ
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
          <button onClick={() => router.back()} className="w-full bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-md text-white mt-4">
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
        <h2 className="text-2xl font-bold mb-4">
          ตอนนี้อยู่ในวิชา {selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})
        </h2>
        <p className="text-lg">ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}</p>
        {/* แสดงรายการปุ่ม timestamp ที่จัดกลุ่มตามวัน */}
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

      {/* ป๊อปอัพแสดงกราฟพาย */}
      {showModal && emotionData && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full relative">
            <h3 className="text-2xl font-semibold mb-4">กราฟแสดงผลอารมณ์ ณ เวลา {convertToLocalTime(selectedTime)}</h3>
            
            <Pie
              data={{
                labels: ["Happy", "Sad", "Anger", "Fearful", "Surprised","Neutral","Disgusted"],
                datasets: [{
                  data: [
                    emotionData.happiness * 100,
                    emotionData.sadness * 100,
                    emotionData.anger * 100,
                    emotionData.fear * 100,
                    emotionData.surprise * 100,
                    emotionData.neutral * 100,
                    emotionData.disgusted * 100,
                  ],
                  backgroundColor: ["#ffea00", "#0c0047", "#ff0026", "#000000", "#8A2BE2","#616161","#2edb02"],
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
