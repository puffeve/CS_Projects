"use client"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase'; 
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { usePathname } from "next/navigation";

// Register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ResultPage = ({ handleSignOut }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userName, setUserName] = useState("");
  const [timestamps, setTimestamps] = useState([]);
  const [emotionData, setEmotionData] = useState(null);
  const [emotionCounts, setEmotionCounts] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const router = useRouter();

  const pathname = usePathname();
  console.log("Current Path:", pathname);
  const isResultPage = pathname === "/result";

  
  useEffect(() => {
    console.log("Current Path:", router.pathname);
  }, [router.pathname]);

  // โหลดข้อมูลจาก LocalStorage
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

  // แปลงเวลาเป็นเวลาท้องถิ่นของไทย (Asia/Bangkok)
  const convertToLocalTime = (detection_time) => {
    const date = new Date(detection_time);
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
  
      // เรียง detection_time ตามลำดับเวลา
      const sortedTimestamps = data.sort((a, b) => new Date(a.detection_time) - new Date(b.detection_time));
  
      // กลุ่ม detection_time ตามวันที่
      const groupedTimestamps = groupTimestampsByDate(sortedTimestamps);
      setTimestamps(groupedTimestamps);
    } catch (error) {
      console.error("Error fetching timestamps:", error.message);
    }
  };
  
  // ฟังก์ชันในการจัดกลุ่ม timestamp ตามวัน
  const groupTimestampsByDate = (timestamps) => {
    const grouped = {};
  
    timestamps.forEach((item) => {
      const date = new Date(item.detection_time);
      const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  
      if (!grouped[dateString]) {
        grouped[dateString] = {
          timestamps: [],
          startTime: item.detection_time,
          endTime: item.detection_time,
        };
      }
  
      grouped[dateString].timestamps.push(item.detection_time);
  
      // หาค่าเริ่มต้นและค่าสิ้นสุดของช่วงเวลาในวันเดียวกัน
      if (new Date(item.detection_time) < new Date(grouped[dateString].startTime)) {
        grouped[dateString].startTime = item.detection_time;
      }
      if (new Date(item.detection_time) > new Date(grouped[dateString].endTime)) {
        grouped[dateString].endTime = item.detection_time;
      }
    });
  
    return Object.keys(grouped).map((date) => ({
      date,
      timestamps: grouped[date].timestamps,
      startTime: grouped[date].startTime,
      endTime: grouped[date].endTime,
    }));
  };

  // ปรับปรุงฟังก์ชันดึงข้อมูลอารมณ์เพื่อคำนวณตามโลจิกของ prepareComparisonData
  const fetchEmotionData = async (date) => {
    if (!selectedCourse || !date) return;
  
    try {
      const startOfDay = new Date(date);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1);
  
      const startOfDayISO = startOfDay.toISOString();
      const endOfDayISO = endOfDay.toISOString();
  
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("emotion")
        .eq("courses_id", selectedCourse.courses_id)
        .gte("detection_time", startOfDayISO)
        .lt("detection_time", endOfDayISO);
  
      if (error) throw error;
  
      // Map for counting emotions
      const emotions = {
        Happy: 0,
        Sad: 0,
        Angry: 0,
        Fearful: 0,
        Surprised: 0,
        Neutral: 0,
        Disgusted: 0,
      };
      
      // Mapping from API response to our emotion keys
      const emotionMapping = {
        'Happiness': 'Happy',
        'Sadness': 'Sad',
        'Anger': 'Angry',
        'Fear': 'Fearful',
        'Surprise': 'Surprised',
        'Neutral': 'Neutral',
        'Disgusted': 'Disgusted'
      };

      // Count emotions
      data.forEach((item) => {
        const mappedEmotion = emotionMapping[item.emotion] || item.emotion;
        if (mappedEmotion in emotions) {
          emotions[mappedEmotion] += 1;
        }
      });
      
      // คำนวณเปอร์เซ็นต์แบบเดียวกับ prepareComparisonData
      const totalDetections = data.length;
      const emotionPercentages = {};
      
      for (const emotion in emotions) {
        const percent = totalDetections > 0
          ? (emotions[emotion] / totalDetections) * 100
          : 0;
        emotionPercentages[emotion] = parseFloat(percent.toFixed(1));
      }
      
      setEmotionCounts(emotions); // เก็บจำนวนตรวจพบของแต่ละอารมณ์
      setEmotionData(emotionPercentages); // เก็บเปอร์เซ็นต์ของแต่ละอารมณ์
      setSelectedTime({ start: startOfDayISO, end: endOfDayISO });
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
  console.log("Emotion Data:", emotionData);
  
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
            เปรียบเทียบผลวิเคราะห์ในรายวิชาเดียวกัน
          </button>
          {/* ลบปุ่ม "เปรียบเทียบผลวิเคราะห์ระหว่างรายวิชา" */}
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
      <h2 className="text-2xl font-bold mb-4">
          ตอนนี้อยู่ในวิชา <span className="text-pink-500">{selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})</span>
        </h2>
        <p className="text-lg">ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}</p>

        {/* เพิ่มข้อความที่ต้องการแสดง */}
        {isResultPage && (
          <h3 className="text-xl mt-4 mb-4">
            <span className="bg-pink-200 px-2 py-1 rounded">
              ตอนนี้อยู่ในหน้าผลวิเคราะห์
            </span>
          </h3>
        )}

        {/* แสดงรายการปุ่ม timestamp ที่จัดกลุ่มตามวัน */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold mb-3">เลือกวัน/เวลาที่ต้องการดูผลวิเคราะห์</h3>
          
          {timestamps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {timestamps.map((group, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-lg font-semibold text-gray-700">
                    {formatDate(new Date(group.date))}
                  </p>
                  <button
                    onClick={() => fetchEmotionData(group.date)}
                    className="block w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 flex items-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10M4 11h16M4 15h16M4 19h16" />
                    </svg>
                    <span>วันที่และเวลา : {convertToLocalTime(group.startTime)} ถึง {new Date(group.endTime).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">ไม่มีข้อมูลเวลาที่บันทึก</p>
          )}
        </div>
      </div>

      {/* ป๊อปอัพแสดงกราฟพายด้วยข้อมูลที่คำนวณตามแบบ prepareComparisonData */}
{showModal && emotionData && (
  <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 relative flex flex-col p-6">
      <h3 className="text-2xl font-semibold mb-6">
        กราฟแสดงผลอารมณ์ระหว่าง {formatDate(new Date(selectedTime.start))}
      </h3>
      
      <div className="flex-grow overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
          <div className="flex items-center justify-center h-full">
            <div className="w-full h-full" style={{ minHeight: "400px" }}>
              <Pie
                data={{
                  labels: ["ความสุข", "ความเศร้า", "ความโกรธ", "ความกลัว", "ความประหลาดใจ", "เป็นกลาง", "ความรังเกียจ"],
                  datasets: [
                    {
                      data: [
                        emotionData.Happy,
                        emotionData.Sad,
                        emotionData.Angry,
                        emotionData.Fearful,
                        emotionData.Surprised,
                        emotionData.Neutral,
                        emotionData.Disgusted,
                      ],
                      backgroundColor: ["#FFF37F", "#A8C6FD", "#FFA7A7", "#B1B1B1", "#F0B1FB", "#E3E3E3", "#B3FDC2"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      bodyFont: {
                        size: 16
                      },
                      callbacks: {
                        label: (context) => `${context.label}: ${context.raw}%`,
                      },
                    },
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        font: {
                          size: 16
                        }
                      }
                    }
                  },
                }}
                height={400}
              />
            </div>
          </div>
          
          <div className="p-4 flex flex-col h-full">
            <h4 className="text-xl font-semibold mb-4">รายละเอียดอารมณ์</h4>
            <div className="overflow-auto flex-grow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-3 text-left">อารมณ์</th>
                    <th className="border px-4 py-3 text-right">เปอร์เซ็นต์</th>
                    <th className="border px-4 py-3 text-right">จำนวนที่ตรวจจับได้</th>
                  </tr>
                </thead>
                <tbody>
                  {emotionCounts && Object.keys(emotionCounts).map((emotion, index) => {
                    // ใช้ emotionToThai mapping
                    const emotionToThai = {
                      "Happy": "ความสุข",
                      "Sad": "ความเศร้า",
                      "Angry": "ความโกรธ",
                      "Fearful": "ความกลัว",
                      "Surprised": "ความประหลาดใจ",
                      "Neutral": "เป็นกลาง",
                      "Disgusted": "ความรังเกียจ"
                    };
                    
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="border px-4 py-3 text-lg">{emotionToThai[emotion]}</td>
                        <td className="border px-4 py-3 text-right text-lg">{emotionData[emotion]}%</td>
                        <td className="border px-4 py-3 text-right text-lg">{emotionCounts[emotion]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={closeModal}
        className="mt-6 py-3 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-lg"
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