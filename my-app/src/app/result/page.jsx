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
  const [monthlyTimestamps, setMonthlyTimestamps] = useState([]);
  const [yearlyTimestamps, setYearlyTimestamps] = useState([]);
  const [emotionData, setEmotionData] = useState(null);
  const [emotionCounts, setEmotionCounts] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [viewMode, setViewMode] = useState('daily');
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const pathname = usePathname();
  const isResultPage = pathname === "/result";

  const [selectedFilterYear, setSelectedFilterYear] = useState(null);
const [selectedFilterMonth, setSelectedFilterMonth] = useState(null);

// สร้าง Function กรองข้อมูล
const filterTimestampsByYearAndMonth = (timestamps) => {
  return timestamps.filter(group => {
    const date = new Date(group.date);
    const matchYear = !selectedFilterYear || date.getFullYear() === parseInt(selectedFilterYear);
    const matchMonth = !selectedFilterMonth || (date.getMonth() + 1) === parseInt(selectedFilterMonth);
    return matchYear && matchMonth;
  });
};

// ดึงรายการปีและเดือนจาก timestamps
const getUniqueYears = () => {
  const years = new Set(timestamps.map(group => new Date(group.date).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
};

const getUniqueMonths = () => {
  const months = new Set(timestamps.map(group => new Date(group.date).getMonth() + 1));
  return Array.from(months).sort((a, b) => a - b);
};

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
 
  const convertToBuddhistYear = (date) => {   //แปลงค.ศ เป็น พ.ศ จ้า
    const year = date.getFullYear();
    return year + 543;
  };
  
  const formatDate = (date) => {  //ตั้งค่าวันนะจ้า
    const buddhistYear = convertToBuddhistYear(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('th-TH', options).format(date);
    return `${formattedDate.replace(/\s\d+/, '')} พ.ศ. ${buddhistYear}`;
  };

  const formatMonth = (dateString) => { //ตั้งค่าเดือนนะจ้า
    const [year, month] = dateString.split('-');
    const date = new Date(year, month -1);
    const buddhistYear = convertToBuddhistYear(date);
    const options = { year: 'numeric', month: 'long' };
    const formattedMonth = new Intl.DateTimeFormat('th-TH', options).format(date);
    return `${formattedMonth.replace(/\s\d+/, '')} พ.ศ. ${buddhistYear}`;
  };

  const formatYear = (yearString) => {
    const year = parseInt(yearString);
    const buddhistYear = year + 543;
    return `พ.ศ. ${buddhistYear}`;
  };

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

  // ฟังก์ชันในการจัดกลุ่ม timestamp ตามปี
  const groupTimestampsByYear = (timestamps) => {
    const grouped = {};
  
    timestamps.forEach((item) => {
      const date = new Date(item.detection_time);
      const yearString = `${date.getFullYear()}`;
  
      if (!grouped[yearString]) {
        grouped[yearString] = {
          timestamps: [],
          startTime: item.detection_time,
          endTime: item.detection_time,
        };
      }
  
      grouped[yearString].timestamps.push(item.detection_time);
  
      // หาค่าเริ่มต้นและสิ้นสุดของปี
      if (new Date(item.detection_time) < new Date(grouped[yearString].startTime)) {
        grouped[yearString].startTime = item.detection_time;
      }
      if (new Date(item.detection_time) > new Date(grouped[yearString].endTime)) {
        grouped[yearString].endTime = item.detection_time;
      }
    });
  
    return Object.keys(grouped).map((year) => ({
      year,
      timestamps: grouped[year].timestamps,
      startTime: grouped[year].startTime,
      endTime: grouped[year].endTime,
    }));
  };

  // ดึง detection_time และจัดกลุ่มทั้งรายวันและรายเดือน
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

      // กลุ่ม detection_time ตามเดือน
      const groupedMonthlyTimestamps = groupTimestampsByMonth(sortedTimestamps);
      setMonthlyTimestamps(groupedMonthlyTimestamps);

      // กลุ่ม detection_time ตามปี
      const groupedYearlyTimestamps = groupTimestampsByYear(sortedTimestamps);
      setYearlyTimestamps(groupedYearlyTimestamps);
    } catch (error) {
      console.error("Error fetching timestamps:", error.message);
    }
  };
  
  // ฟังก์ชันในการจัดกลุ่ม timestamp ตามวัน (เดิม)
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

  // ฟังก์ชันในการจัดกลุ่ม timestamp ตามเดือน (เดิม)
  const groupTimestampsByMonth = (timestamps) => {
    const grouped = {};
  
    timestamps.forEach((item) => {
      const date = new Date(item.detection_time);
      const monthString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
      if (!grouped[monthString]) {
        grouped[monthString] = {
          timestamps: [],
          startTime: item.detection_time,
          endTime: item.detection_time,
        };
      }
  
      grouped[monthString].timestamps.push(item.detection_time);
  
      // อัปเดตเวลาเริ่มต้นและสิ้นสุด
      grouped[monthString].startTime = new Date(Math.min(
        new Date(grouped[monthString].startTime),
        new Date(item.detection_time)
      )).toISOString();
  
      grouped[monthString].endTime = new Date(Math.max(
        new Date(grouped[monthString].endTime),
        new Date(item.detection_time)
      )).toISOString();
    });
  
    return Object.keys(grouped).map((month) => ({
      month,
      timestamps: grouped[month].timestamps,
      startTime: grouped[month].startTime,
      endTime: grouped[month].endTime,
    }));
  };

  // ปรับปรุงฟังก์ชันดึงข้อมูลอารมณ์ให้รองรับการดึงข้อมูลรายปี
  const fetchEmotionData = async (period, periodType = 'daily') => {  
    console.log('Fetching Emotion Data:', { period, periodType });  // แสดงข้อมูลช่วงเวลาที่กำลังดึงข้อมูลอารมณ์
  
    if (!selectedCourse || !period) return;
  
    try {
      let startOfPeriod, endOfPeriod;  // กำหนดตัวแปรสำหรับช่วงเวลาเริ่มต้นและสิ้นสุด
      
      if (periodType === 'yearly') {    // ถ้าประเภทช่วงเวลาเป็นรายปี
        const year = parseInt(period);   // แปลงค่าปีจาก string เป็นตัวเลข
        startOfPeriod = new Date(year, 0, 1);       //วันที่เริ่มต้นของปี 0 คือ มกราคม ,1 คือวันที่ 1
        endOfPeriod = new Date(year, 11, 31, 23, 59, 59, 999);    //11 คือ ธันวาคม 31 คือวันที่สุดท้าย 23:59:59:999 คือเวลา
        setSelectedYear(period);
      } else if (periodType === 'monthly') {    // ถ้าประเภทช่วงเวลาเป็นรายเดือน
        const [year, month] = period.split('-').map(Number); // แยกค่าปีและเดือนจาก string และแปลงเป็นตัวเลข
        console.log('Monthly Period Details:', { year, month });
        
        startOfPeriod = new Date(year, month - 1, 1); // วันที่เริ่มต้นของเดือน (JavaScript ใช้ index เดือนเริ่มที่ 0)
        endOfPeriod = new Date(year, month, 0);  // วันที่สิ้นสุดของเดือน (ใส่วันที่ 0 จะได้วันสุดท้ายของเดือนก่อนหน้า)
        endOfPeriod.setHours(23, 59, 59, 999);  // กำหนดเวลาเป็น 23:59:59.999
        
        setSelectedMonth(period);  // บันทึกเดือนที่เลือก
      } else {  // ถ้าเป็นช่วงเวลารายวัน
        startOfPeriod = new Date(period);   // แปลงค่า period เป็น Date
        endOfPeriod = new Date(startOfPeriod);    // คัดลอกค่าจาก startOfPeriod
        endOfPeriod.setDate(startOfPeriod.getDate() + 1);  // กำหนดให้ช่วงเวลาสิ้นสุดเป็นวันถัดไป
      }
  
      const startOfPeriodISO = startOfPeriod.toISOString();
      const endOfPeriodISO = endOfPeriod.toISOString();
  
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("emotion")
        .eq("courses_id", selectedCourse.courses_id)  // ค้นหาข้อมูลที่ตรงกับคอร์สที่เลือก
        .gte("detection_time", startOfPeriodISO)   // กรองข้อมูลที่มีเวลามากกว่าหรือเท่ากับ startOfPeriod
        .lt("detection_time", endOfPeriodISO);  // กรองข้อมูลที่มีเวลาน้อยกว่า endOfPeriod
  
      if (error) throw error;
  
      // เตรียมข้อมูลอารมณ์
      const emotions = {   //สร้างตัวแปรเก็บค่าอารมณ์ โดยเริ่มจาก 0
        Happy: 0,
        Sad: 0,
        Angry: 0,
        Fearful: 0,
        Surprised: 0,
        Neutral: 0,
        Disgusted: 0,
      };
      
      const emotionMapping = {  //สร้างตัวแปร emotionMapping เพื่อแมปชื่ออารมณ์
        'Happiness': 'Happy',
        'Sadness': 'Sad',
        'Anger': 'Angry',
        'Fear': 'Fearful',
        'Surprise': 'Surprised',
        'Neutral': 'Neutral',
        'Disgusted': 'Disgusted'
      };

      // นับอารมณ์
      data.forEach((item) => {    //ใช้ .forEach() วนลูปข้อมูล data คืออาร์เรย์ของอารมณ์ที่ถูกตรวจจับ
        const mappedEmotion = emotionMapping[item.emotion] || item.emotion;  //item.emotion คืออารมณ์ที่ได้จากข้อมูล
        if (mappedEmotion in emotions) {   //ถ้า item.emotion มีอยู่ใน emotionMapping → ใช้ค่าที่แมปแล้ว
          emotions[mappedEmotion] += 1;   //ถ้าค่า mappedEmotion อยู่ใน emotions → เพิ่มจำนวน (+1)
        }
      });
      
      // คำนวณเปอร์เซ็นต์
      const totalDetections = data.length;  //นับจำนวนข้อมูลทั้งหมด (จำนวนอารมณ์ที่ถูกตรวจจับ)
      const emotionPercentages = {};   // ตัวแปรเก็บค่าเปอร์เซ็นต์
      
      for (const emotion in emotions) {  //ใช้ for...in วนลูปคำนวณเปอร์เซ็นต์ของแต่ละอารมณ์
        const percent = totalDetections > 0
          ? (emotions[emotion] / totalDetections) * 100   // คำนวณเป็นเปอร์เซ็นต์
          : 0;
        emotionPercentages[emotion] = parseFloat(percent.toFixed(1));    //parseFloat() แปลงค่าเป็นตัวเลขจริง (ไม่ใช่สตริง) , ใช้ toFixed(1) ปัดเป็นทศนิยม 1 ตำแหน่ง
      }
      
      setEmotionCounts(emotions);  // อัปเดต state ของจำนวนอารมณ์ที่ตรวจจับได้
      setEmotionData(emotionPercentages);  // อัปเดต state ของเปอร์เซ็นต์อารมณ์
      setSelectedTime({ start: startOfPeriodISO, end: endOfPeriodISO });  // บันทึกช่วงเวลาที่เลือก
      setShowModal(true); // แสดง Modal กราฟอารมณ์
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
      {/* ส่วนของ sidebar */}
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
          <button 
            onClick={() => router.push('/compare_courses')}
            className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md "
          >
            เปรียบเทียบผลวิเคราะห์ระหว่างรายวิชา
          </button>
          <button onClick={() => router.push("/Teacher_dashboard")} className="w-full bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-md text-white mt-4">
            ย้อนกลับ
          </button>
        </div>
        {/* ปุ่มออกจากระบบ */}
        <div className="sticky bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-red-400 active:bg-[#1d2f3f] focus:outline-none text-white rounded-lg"
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

        {isResultPage && (
          <h3 className="text-xl mt-4 mb-4">
            <span className="bg-pink-200 px-2 py-1 rounded">
              ตอนนี้อยู่ในหน้าผลวิเคราะห์
            </span>
          </h3>
        )}

        {/* ปุ่มสลับโหมดการดู */}
         <div className="my-4 flex space-x-4">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'daily'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            ดูผลวิเคราะห์รายวัน
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'monthly'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            ดูผลวิเคราะห์รายเดือน
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'yearly'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            ดูผลวิเคราะห์รายปี
          </button>
        </div>
  
        {/* แสดงรายการปุ่ม timestamp */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold mb-3">เลือกวัน/เวลาที่ต้องการดูผลวิเคราะห์</h3>
          
          
  {viewMode === 'daily' && timestamps.length > 0 ? (
  <div>
    {/* Group timestamps by month */}
    {Object.entries(
      timestamps.reduce((acc, group) => {
        const monthKey = new Date(group.date).toLocaleString('default', { year: 'numeric', month: 'long' });
        if (!acc[monthKey]) acc[monthKey] = [];  // ถ้ายังไม่มี key สำหรับเดือนนี้ ให้สร้าง array ใหม่
        acc[monthKey].push(group);  // เพิ่มข้อมูลเข้าไปใน array ของเดือนนั้น
        return acc;
      }, {})
    ).map(([month, monthGroups]) => ( // แปลงข้อมูลเป็น array ของ key-value เพื่อ map ไปแสดงผล
      <div key={month} className="mb-6">
        <h4 className="bg-pink-100 px-2 py-1 rounded text-xl font-semibold text-gray-700 mb-4">{month}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {monthGroups.map((group, index) => (   // วนลูปข้อมูลของเดือนนั้น
            <div key={index} className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">
                {formatDate(new Date(group.date))}  {/* แปลง timestamp เป็นรูปแบบวันที่ */}
              </p>
              <button
                onClick={() => fetchEmotionData(group.date, 'daily')}
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
      </div>
    ))}
  </div>
          ) :  viewMode === 'monthly' && monthlyTimestamps.length > 0 ? (
            <div>
              {/* Group timestamps by year */}
              {Object.entries(
                monthlyTimestamps.reduce((acc, group) => {
                  const date = new Date(group.month + '-01'); // แปลงเดือนเป็นวันที่ 1 ของเดือนนั้น
                  const yearKey = date.getFullYear().toString(); // ดึงค่าปีออกมาเป็น key
                  if (!acc[yearKey]) acc[yearKey] = [];
                  acc[yearKey].push(group);
                  return acc;
                }, {})
              ).map(([year, yearGroups]) => (  // วนลูปปีที่จัดกลุ่มไว้
                <div key={year} className="mb-6">
                  <h4 className="bg-pink-100 px-2 py-1 rounded text-xl font-semibold text-gray-700 mb-4">
                    {formatYear(year)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {yearGroups.map((group, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-lg font-semibold text-gray-700">
                          {formatMonth(group.month)}
                        </p>
                        <button
                          onClick={() => fetchEmotionData(group.month, 'monthly')} // ดึงข้อมูลรายเดือน
                          className="block w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 flex items-center space-x-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10M4 11h16M4 15h16M4 19h16" />
                          </svg>
                          <span>ช่วงเวลา: {convertToLocalTime(group.startTime)} ถึง {convertToLocalTime(group.endTime)}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'yearly' && yearlyTimestamps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {yearlyTimestamps.map((group, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-lg font-semibold text-gray-700">
                    {formatYear(group.year)}
                  </p>
                  <button
                    onClick={() => fetchEmotionData(group.year, 'yearly')} // ดึงข้อมูลรายปี
                    className="block w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 flex items-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10M4 11h16M4 15h16M4 19h16" />
                    </svg>
                    <span>ช่วงเวลา: {convertToLocalTime(group.startTime)} ถึง {convertToLocalTime(group.endTime)}</span>
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
              กราฟแสดงผลอารมณ์ {
                viewMode === 'daily' 
                  ? formatDate(new Date(selectedTime.start)) 
                  : viewMode === 'monthly'
                    ? formatMonth(selectedMonth)
                    : formatYear(selectedYear)
              }
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
