"use client"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase'; 
import { Pie, Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { usePathname } from "next/navigation";

// Register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

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
  // เพิ่ม state สำหรับข้อมูลจำนวนใบหน้า
  const [faceCountData, setFaceCountData] = useState({
    totalFaces: 0,
    avgFaces: 0,
    maxFaces: 0,
    minFaces: 0
  });
  
  // เพิ่ม state สำหรับการวิเคราะห์ช่วงคาบ
  const [periodAnalysis, setPeriodAnalysis] = useState({
    startTime: null,
    endTime: null,
    periods: {
      early: { emotions: {}, count: 0, faces: 0 },
      middle: { emotions: {}, count: 0, faces: 0 },
      late: { emotions: {}, count: 0, faces: 0 }
    },
    negativeEmotionPeaks: [],
    emotionTimeline: []
  });

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

  // ฟังก์ชันวิเคราะห์ช่วงเวลาของคาบ (ต้นคาบ, กลางคาบ, ท้ายคาบ)
  const analyzePeriods = (data, startTime, endTime) => {
    if (!data || data.length === 0) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalDuration = end - start;
    
    // แบ่งช่วงเวลาเป็น 3 ส่วน (ต้นคาบ, กลางคาบ, ท้ายคาบ)
    const periodDuration = totalDuration / 3;
    
    // สร้างจุดแบ่งเวลา
    const earlyEnd = new Date(start.getTime() + periodDuration);
    const middleEnd = new Date(start.getTime() + (periodDuration * 2));
    
    // สร้างโครงสร้างข้อมูลเพื่อรวบรวมอารมณ์ในแต่ละช่วง
    const periods = {
      early: { emotions: {}, count: 0, faces: 0, negativeCount: 0 },
      middle: { emotions: {}, count: 0, faces: 0, negativeCount: 0 },
      late: { emotions: {}, count: 0, faces: 0, negativeCount: 0 }
    };
    
    // อารมณ์ด้านลบ
    const negativeEmotions = ['Sadness', 'Anger', 'Fear', 'Disgusted'];
    
    // สร้างข้อมูลสำหรับกราฟไทม์ไลน์อารมณ์
    const timelineData = {};

    // วนลูปวิเคราะห์ข้อมูลแต่ละรายการ
    data.forEach(item => {
      const itemTime = new Date(item.detection_time);
      const emotion = item.emotion;
      const numFaces = item.num_faces || 0;
      
      // บันทึกข้อมูลสำหรับกราฟไทม์ไลน์
      const timeKey = itemTime.toISOString();
      if (!timelineData[timeKey]) {
        timelineData[timeKey] = {
          time: timeKey,
          timestamp: itemTime,
          emotions: {},
          totalFaces: 0
        };
      }
      
      if (!timelineData[timeKey].emotions[emotion]) {
        timelineData[timeKey].emotions[emotion] = 0;
      }
      timelineData[timeKey].emotions[emotion]++;
      timelineData[timeKey].totalFaces += numFaces;
      
      // จัดลงช่วงเวลา
      let period;
      if (itemTime <= earlyEnd) {
        period = periods.early;
      } else if (itemTime <= middleEnd) {
        period = periods.middle;
      } else {
        period = periods.late;
      }
      
      // เพิ่มข้อมูลอารมณ์ในช่วงนั้น
      if (!period.emotions[emotion]) {
        period.emotions[emotion] = 0;
      }
      period.emotions[emotion]++;
      period.count++;
      period.faces += numFaces;
      
      // ตรวจสอบและนับอารมณ์ด้านลบ
      if (negativeEmotions.includes(emotion)) {
        period.negativeCount++;
      }
    });
    
    // ค้นหาจุดที่มีอารมณ์ด้านลบสูงสุด
    let negativeEmotionPeaks = [];
    const sortedTimeline = Object.values(timelineData)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // คำนวณช่วงเวลาที่มีอารมณ์ด้านลบสูงสุด (ใช้ sliding window)
    const windowSize = 3; // ตรวจสอบทุก 3 จุดเวลา
    for (let i = 0; i <= sortedTimeline.length - windowSize; i++) {
      let negativeCount = 0;
      let totalFaces = 0;
      let windowItems = [];
      
      for (let j = 0; j < windowSize; j++) {
        const item = sortedTimeline[i + j];
        let itemNegativeCount = 0;
        
        // นับอารมณ์ด้านลบในช่วงนั้น
        for (const emotion of negativeEmotions) {
          if (item.emotions[emotion]) {
            itemNegativeCount += item.emotions[emotion];
          }
        }
        
        negativeCount += itemNegativeCount;
        totalFaces += item.totalFaces;
        windowItems.push({
          time: item.time,
          negativeCount: itemNegativeCount,
          totalFaces: item.totalFaces
        });
      }
      
      // คำนวณเปอร์เซ็นต์อารมณ์ด้านลบ
      const negativePercent = totalFaces > 0 ? (negativeCount / totalFaces) * 100 : 0;
      
      // หากมีเปอร์เซ็นต์อารมณ์ด้านลบมากกว่า 40% ให้บันทึกไว้
      if (negativePercent >= 40) {
        negativeEmotionPeaks.push({
          startTime: windowItems[0].time,
          endTime: windowItems[windowItems.length - 1].time,
          negativeCount,
          totalFaces,
          negativePercent: negativePercent.toFixed(1)
        });
      }
    }
    
    // เรียงลำดับจุดพีคโดยเรียงตามเปอร์เซ็นต์อารมณ์ด้านลบจากมากไปน้อย
    negativeEmotionPeaks.sort((a, b) => parseFloat(b.negativePercent) - parseFloat(a.negativePercent));
    
    // จำกัดเฉพาะ 3 จุดแรกที่มีค่าสูงสุด
    negativeEmotionPeaks = negativeEmotionPeaks.slice(0, 3);
    
    return {
      startTime,
      endTime,
      periods,
      negativeEmotionPeaks,
      emotionTimeline: sortedTimeline
    };
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
  
      // แก้ไขให้ดึงข้อมูล num_faces และ detection_time ด้วย
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("emotion, num_faces, detection_time")
        .eq("courses_id", selectedCourse.courses_id)  // ค้นหาข้อมูลที่ตรงกับคอร์สที่เลือก
        .gte("detection_time", startOfPeriodISO)   // กรองข้อมูลที่มีเวลามากกว่าหรือเท่ากับ startOfPeriod
        .lt("detection_time", endOfPeriodISO);  // กรองข้อมูลที่มีเวลาน้อยกว่า endOfPeriod
  
      if (error) throw error;
  
      // วิเคราะห์ข้อมูลแบ่งตามช่วงเวลาของคาบ
      const periodAnalysisResult = analyzePeriods(data, startOfPeriodISO, endOfPeriodISO);
      setPeriodAnalysis(periodAnalysisResult);
      
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

      // คำนวณจำนวนใบหน้าที่ไม่ซ้ำกัน (เพื่อป้องกันการนับซ้ำ)
      const uniqueFaceIds = new Set();
      let totalFaces = 0;
      let faceCounts = [];
      
      // นับอารมณ์และเก็บค่าจำนวนใบหน้า
      data.forEach((item) => {
        const mappedEmotion = emotionMapping[item.emotion] || item.emotion;
        if (mappedEmotion in emotions) {
          emotions[mappedEmotion] += 1;
        }
        
        // เก็บข้อมูลจำนวนใบหน้า
        if (item.num_faces !== null && item.num_faces !== undefined) {
          // สร้าง ID เฉพาะสำหรับแต่ละรายการเพื่อป้องกันการนับซ้ำ
          // ในกรณีนี้เราใช้ detection_time เป็นตัวบ่งชี้ที่ไม่ซ้ำกัน
          const faceIdentifier = item.detection_time;
          
          if (!uniqueFaceIds.has(faceIdentifier)) {
            uniqueFaceIds.add(faceIdentifier);
            faceCounts.push(item.num_faces);
            totalFaces += item.num_faces;
          }
        }
      });
      
      // คำนวณสถิติของจำนวนใบหน้า
      const maxFaces = faceCounts.length > 0 ? Math.max(...faceCounts) : 0;
      const minFaces = faceCounts.length > 0 ? Math.min(...faceCounts) : 0;
      
      // อัปเดตข้อมูลจำนวนใบหน้า
      setFaceCountData({
        totalFaces,
        avgFaces: 0, // ไม่ต้องการค่าเฉลี่ยแล้ว
        maxFaces,
        minFaces
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
  
  // ฟังก์ชันสำหรับปิดป๊อปอัพ - แก้ไขให้รีเซ็ตสถานะทั้งหมดที่เกี่ยวข้อง
  const closeModal = () => {
    setShowModal(false);
    setEmotionData(null);
    setEmotionCounts(null);
    setSelectedTime(null);
    setFaceCountData({
      totalFaces: 0,
      avgFaces: 0,
      maxFaces: 0,
      minFaces: 0
    });
    setPeriodAnalysis({
      startTime: null,
      endTime: null,
      periods: {
        early: { emotions: {}, count: 0, faces: 0 },
        middle: { emotions: {}, count: 0, faces: 0 },
        late: { emotions: {}, count: 0, faces: 0 }
      },
      negativeEmotionPeaks: [],
      emotionTimeline: []
    });
    
    // รีเซ็ตสถานะเพิ่มเติมตามประเภทการดู
    if (viewMode === 'monthly') {
      setSelectedMonth(null);
    } else if (viewMode === 'yearly') {
      setSelectedYear(null);
    }
  };

  // ฟังก์ชันสำหรับวิเคราะห์ว่าผลลัพธ์นี้บ่งบอกอะไร
  const getAnalysisInsights = () => {
    if (!emotionData || !emotionCounts || !faceCountData) return [];
    
    const insights = [];
    
    // เพิ่มข้อมูลเชิงลึกเกี่ยวกับจำนวนนักเรียน
    if (faceCountData.totalFaces > 0) {
      if (faceCountData.maxFaces - faceCountData.minFaces > 5) {
        insights.push(`มีความแตกต่างของจำนวนนักเรียนในชั่วโมงนี้ค่อนข้างมาก (${faceCountData.minFaces} - ${faceCountData.maxFaces} คน) อาจมีนักเรียนเข้า-ออกระหว่างคาบ`);
      }
      
      if (faceCountData.avgFaces < 10) {
        insights.push(`จำนวนนักเรียนเฉลี่ยต่ำกว่า 10 คน อาจเป็นชั้นเรียนขนาดเล็กหรือมีนักเรียนขาดเรียนจำนวนมาก`);
      }
    }
    
    // เพิ่มข้อมูลเชิงลึกเกี่ยวกับอารมณ์
    const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    
    // วิเคราะห์อารมณ์เชิงบวก-ลบ
    const positiveEmotions = emotionCounts.Happy + emotionCounts.Surprised;
    const negativeEmotions = emotionCounts.Sad + emotionCounts.Angry + emotionCounts.Fearful + emotionCounts.Disgusted;
    const neutralEmotions = emotionCounts.Neutral;
    
    const positivePercent = totalEmotions > 0 ? (positiveEmotions / totalEmotions) * 100 : 0;
    const negativePercent = totalEmotions > 0 ? (negativeEmotions / totalEmotions) * 100 : 0;
    const neutralPercent = totalEmotions > 0 ? (neutralEmotions / totalEmotions) * 100 : 0;
    
    if (positivePercent > 60) {
      insights.push(`บรรยากาศในชั้นเรียนเป็นไปในทางบวก (${positivePercent.toFixed(1)}% เป็นอารมณ์เชิงบวก) แสดงว่านักเรียนมีความสุขและสนใจในการเรียน`);
    } else if (negativePercent > 40) {
      insights.push(`บรรยากาศในชั้นเรียนมีอารมณ์เชิงลบค่อนข้างสูง (${negativePercent.toFixed(1)}% เป็นอารมณ์เชิงลบ) อาจต้องปรับเทคนิคการสอนหรือเนื้อหาให้น่าสนใจมากขึ้น`);
    } else if (neutralPercent > 50) {
      insights.push(`นักเรียนส่วนใหญ่มีอารมณ์เป็นกลาง (${neutralPercent.toFixed(1)}%) อาจต้องเพิ่มกิจกรรมที่น่าสนใจเพื่อกระตุ้นการมีส่วนร่วม`);
    }
    
    // เพิ่มข้อมูลเชิงลึกเกี่ยวกับจุดที่มีอารมณ์ด้านลบสูง
    if (periodAnalysis && periodAnalysis.negativeEmotionPeaks && periodAnalysis.negativeEmotionPeaks.length > 0) {
      const peak = periodAnalysis.negativeEmotionPeaks[0]; // เลือกจุดที่มีอารมณ์ด้านลบสูงสุด
      const peakTime = new Date(peak.startTime);
      const peakTimeStr = peakTime.toLocaleTimeString("th-TH", {hour: '2-digit', minute: '2-digit'});
      
      insights.push(`พบจุดที่มีอารมณ์ด้านลบสูงสุด (${peak.negativePercent}%) ในช่วงเวลาประมาณ ${peakTimeStr} ควรตรวจสอบว่าเกิดอะไรขึ้นในช่วงเวลานี้`);
    }
    
    // วิเคราะห์แต่ละช่วงของคาบเรียน
    if (periodAnalysis && periodAnalysis.periods) {
      const { early, middle, late } = periodAnalysis.periods;
      
      // เปรียบเทียบอารมณ์ในแต่ละช่วง
      if (early.count > 0 && middle.count > 0 && late.count > 0) {
        const earlyNegPercent = (early.negativeCount / early.count) * 100;
        const middleNegPercent = (middle.negativeCount / middle.count) * 100;
        const lateNegPercent = (late.negativeCount / late.count) * 100;
        
        if (earlyNegPercent > middleNegPercent && earlyNegPercent > lateNegPercent) {
          insights.push(`นักเรียนมีอารมณ์ด้านลบสูงในช่วงต้นคาบ (${earlyNegPercent.toFixed(1)}%) อาจเกิดจากความไม่พร้อมหรือยังปรับตัวไม่ได้กับบทเรียน`);
        } else if (middleNegPercent > earlyNegPercent && middleNegPercent > lateNegPercent) {
          insights.push(`นักเรียนมีอารมณ์ด้านลบสูงในช่วงกลางคาบ (${middleNegPercent.toFixed(1)}%) อาจเกิดจากเนื้อหายากหรือน่าเบื่อ ควรมีกิจกรรมแทรกเพื่อดึงความสนใจ`);
        } else if (lateNegPercent > earlyNegPercent && lateNegPercent > middleNegPercent) {
          insights.push(`นักเรียนมีอารมณ์ด้านลบสูงในช่วงท้ายคาบ (${lateNegPercent.toFixed(1)}%) อาจเกิดจากความเหนื่อยล้าหรือเบื่อหน่าย ควรปรับจังหวะการสอนในช่วงท้ายให้กระชับ`);
        }
      }
    }
    
    // เพิ่มคำแนะนำทั่วไป
    insights.push("ผลวิเคราะห์นี้ช่วยให้อาจารย์เข้าใจอารมณ์และความรู้สึกของนักเรียนในแต่ละช่วงเวลา สามารถนำไปปรับปรุงวิธีการสอนให้เหมาะสมกับนักเรียนมากยิ่งขึ้น");
    
    return insights;
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

        {/* คำอธิบายประโยชน์ของผลวิเคราะห์ */}
        <div className="bg-blue-50 p-4 my-4 rounded-lg shadow border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">ประโยชน์ของผลการวิเคราะห์อารมณ์</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>ช่วยให้ผู้สอนเข้าใจอารมณ์ความรู้สึกของผู้เรียนในแต่ละช่วงเวลา</li>
            <li>ระบุช่วงเวลาที่เกิดอารมณ์ด้านลบ (เศร้า, โกรธ, กลัว) เพื่อวิเคราะห์หาสาเหตุและปรับปรุงการสอน</li>
            <li>ประเมินประสิทธิภาพของเทคนิคการสอนหรือกิจกรรมที่จัดขึ้น</li>
            <li>ติดตามพัฒนาการด้านอารมณ์ของผู้เรียนตลอดภาคการศึกษา</li>
            <li>นำข้อมูลไปใช้ในการวางแผนการสอนในครั้งต่อไปให้เหมาะสมกับผู้เรียนมากยิ่งขึ้น</li>
          </ul>
        </div>

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
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 relative flex flex-col p-6 overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-2">
              กราฟแสดงผลอารมณ์ {
                viewMode === 'daily' 
                  ? formatDate(new Date(selectedTime.start)) 
                  : viewMode === 'monthly'
                    ? formatMonth(selectedMonth)
                    : formatYear(selectedYear)
              }
            </h3>
            
            {/* ส่วนแสดงข้อมูลจำนวนใบหน้า - แก้ไขข้อความตามที่ต้องการพร้อมคำอธิบายเพิ่มเติม */}
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <div className="flex flex-wrap gap-4 justify-between">
                <div className="text-center bg-white p-2 rounded-lg shadow flex-1">
                  <h4 className="text-blue-600 font-semibold">จำนวนการตรวจจับอารมณ์จากใบหน้าทั้งหมด</h4>
                  <p className="text-2xl font-bold">{faceCountData.totalFaces} ครั้ง</p>
                  <p className="text-xs text-gray-600 mt-1">จำนวนของการแสดงอารมณ์ทางใบหน้าจากใบหน้าที่พบในคาบ ซึ่งใบหน้าใดใบหน้าหนึ่งสามารถถูกตรวจจับได้หลายครั้ง</p>
                </div>
                <div className="text-center bg-white p-2 rounded-lg shadow flex-1">
                  <h4 className="text-blue-600 font-semibold">จำนวนใบหน้าสูงสุดในคาบนี้</h4>
                  <p className="text-2xl font-bold">{faceCountData.maxFaces} ใบหน้า</p>
                  
                </div>
                <div className="text-center bg-white p-2 rounded-lg shadow flex-1">
                  <h4 className="text-blue-600 font-semibold">จำนวนใบหน้าต่ำสุดในคาบนี้</h4>
                  <p className="text-2xl font-bold">{faceCountData.minFaces} ใบหน้า</p>
                  
                </div>
              </div>
              <div className="mt-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">หมายเหตุ:</span> ระบบจะนับจำนวนของการแสดงอารมณ์ทางใบหน้าจากใบหน้าที่พบในคาบเรียน ซึ่งใบหน้าเดียวกันอาจแสดงอารมณ์ที่แตกต่างกันในแต่ละช่วงเวลาและถูกนับหลายครั้ง ดังนั้นจำนวนที่แสดงจึงอาจมากกว่าจำนวนนักเรียนจริงในห้องเรียน
                </p>
              </div>
            </div>

            {/* ส่วนแสดงผลการวิเคราะห์ช่วงเวลาและอารมณ์ด้านลบ - ทำให้เข้าใจง่ายขึ้น */}
            {periodAnalysis && periodAnalysis.negativeEmotionPeaks && periodAnalysis.negativeEmotionPeaks.length > 0 && (
              <div className="bg-amber-50 p-3 rounded-lg mb-4">
                <h4 className="text-amber-800 font-semibold text-lg mb-2">การวิเคราะห์ช่วงเวลาที่มีอารมณ์ด้านลบ</h4>
                <div className="space-y-2">
                  {periodAnalysis.negativeEmotionPeaks.map((peak, index) => {
                    const startTime = new Date(peak.startTime);
                    const endTime = new Date(peak.endTime);
                    return (
                      <div key={index} className="bg-white p-3 rounded-lg shadow border-l-4 border-amber-500">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="font-medium text-amber-800">
                            พบจุดที่มีอารมณ์ด้านลบสูง ({peak.negativePercent}%)
                          </p>
                        </div>
                        <div className="ml-7">
                          <p className="text-gray-700">
                            <span className="font-medium">ช่วงเวลา:</span> {startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} ถึง {endTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            อาจเกิดจากเนื้อหายากหรือการสอนที่เร็วเกินไป ควรพิจารณาทบทวนเนื้อหาหรือปรับจังหวะการสอนในช่วงเวลานี้
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
{/* เพิ่มส่วนอธิบายการคำนวณอารมณ์เพื่อความเข้าใจของผู้ใช้ - ใส่หลังจากส่วนแสดงข้อมูลจำนวนใบหน้า */}
<div className="bg-violet-50 p-3 rounded-lg mb-4 border border-violet-200">
  <h4 className="text-lg font-semibold text-violet-800 mb-2 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    วิธีการคำนวณกลุ่มอารมณ์
  </h4>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
    <div className="bg-white p-3 rounded-lg shadow border-l-4 border-yellow-400">
      <p className="font-medium text-yellow-600 mb-1">อารมณ์เชิงบวก (Positive)</p>
      <ul className="list-disc ml-5 text-sm text-gray-700">
        <li>ความสุข (Happy/Happiness)</li>
        <li>ความประหลาดใจ (Surprised/Surprise)</li>
      </ul>
      <p className="text-xs text-gray-500 mt-2 italic">เปอร์เซ็นต์อารมณ์เชิงบวกมากกว่า 60% = บรรยากาศเชิงบวก</p>
    </div>
    <div className="bg-white p-3 rounded-lg shadow border-l-4 border-red-400">
      <p className="font-medium text-red-600 mb-1">อารมณ์เชิงลบ (Negative)</p>
      <ul className="list-disc ml-5 text-sm text-gray-700">
        <li>ความเศร้า (Sad/Sadness)</li>
        <li>ความโกรธ (Angry/Anger)</li>
        <li>ความกลัว (Fearful/Fear)</li>
        <li>ความรังเกียจ (Disgusted/Disgust)</li>
      </ul>
      <p className="text-xs text-gray-500 mt-2 italic">เปอร์เซ็นต์อารมณ์เชิงลบมากกว่า 40% = ควรปรับวิธีการสอน</p>
    </div>
    <div className="bg-white p-3 rounded-lg shadow border-l-4 border-gray-400">
      <p className="font-medium text-gray-600 mb-1">อารมณ์เป็นกลาง (Neutral)</p>
      <ul className="list-disc ml-5 text-sm text-gray-700">
        <li>เป็นกลาง (Neutral)</li>
      </ul>
      <p className="text-xs text-gray-500 mt-2 italic">เปอร์เซ็นต์อารมณ์เป็นกลางมากกว่า 50% = ควรเพิ่มกิจกรรมที่น่าสนใจ</p>
    </div>
  </div>
  <div className="mt-3 text-sm bg-white p-2 rounded-lg border border-violet-100">
    <p className="text-violet-800">
      <span className="font-medium">วิธีการคำนวณ:</span> ระบบจะนับจำนวนอารมณ์ทั้งหมดที่ตรวจจับได้ และคำนวณเปอร์เซ็นต์ของแต่ละกลุ่มอารมณ์ เพื่อวิเคราะห์บรรยากาศในชั้นเรียนโดยรวม กลุ่มที่มีเปอร์เซ็นต์สูงกว่าเกณฑ์จะถูกนำมาใช้ในการให้คำแนะนำเพื่อปรับปรุงการเรียนการสอน
    </p>
  </div>
</div>
            {/* วิเคราะห์ช่วงของคาบเรียน - เพิ่มแผนภูมิแท่งเพื่อให้เห็นภาพชัดเจนขึ้น */}
            {periodAnalysis && periodAnalysis.periods && (
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <h4 className="text-green-800 font-semibold text-lg mb-2">การวิเคราะห์ตามช่วงคาบเรียน</h4>
                
                {/* เพิ่มแผนภูมิแท่งเปรียบเทียบช่วงคาบ */}
                {/* This is the updated section with the modified labels */}
<div className="mb-4" style={{ height: "200px" }}>
  <Bar
    data={{
      labels: ['ต้นคาบ', 'กลางคาบ', 'ท้ายคาบ'],
      datasets: [
        {
          label: 'จำนวนการตรวจจับอารมณ์จากใบหน้าของนักเรียนทั้งหมด',
          data: [
            periodAnalysis.periods.early.faces,
            periodAnalysis.periods.middle.faces,
            periodAnalysis.periods.late.faces
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'อารมณ์ด้านลบ จากจำนวนการตรวจจับอารมณ์จากใบหน้า',
          data: [
            periodAnalysis.periods.early.negativeCount,
            periodAnalysis.periods.middle.negativeCount,
            periodAnalysis.periods.late.negativeCount
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    }}
    options={{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#000',
          bodyColor: '#000',
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${context.raw} ครั้ง`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'จำนวน (ครั้ง)'
          },
          ticks: {
            stepSize: 1
          }
        }
      }
    }}
  />
</div>
                
                  <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow">
                    <h5 className="font-medium text-center border-b pb-1 mb-2 text-blue-700">ต้นคาบ</h5>
                    <div className="text-center mb-2">
                      <span className="text-xl font-bold">{periodAnalysis.periods.early.faces}</span>
                      <span className="text-sm ml-1">ครั้ง</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>อารมณ์ด้านลบ:</span>
                      <span className="font-medium">
                        {periodAnalysis.periods.early.count > 0 
                          ? ((periodAnalysis.periods.early.negativeCount / periodAnalysis.periods.early.count) * 100).toFixed(0) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow">
                    <h5 className="font-medium text-center border-b pb-1 mb-2 text-purple-700">กลางคาบ</h5>
                    <div className="text-center mb-2">
                      <span className="text-xl font-bold">{periodAnalysis.periods.middle.faces}</span>
                      <span className="text-sm ml-1">ครั้ง</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>อารมณ์ด้านลบ:</span>
                      <span className="font-medium">
                        {periodAnalysis.periods.middle.count > 0 
                          ? ((periodAnalysis.periods.middle.negativeCount / periodAnalysis.periods.middle.count) * 100).toFixed(0) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow">
                    <h5 className="font-medium text-center border-b pb-1 mb-2 text-teal-700">ท้ายคาบ</h5>
                    <div className="text-center mb-2">
                      <span className="text-xl font-bold">{periodAnalysis.periods.late.faces}</span>
                      <span className="text-sm ml-1">ครั้ง</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>อารมณ์ด้านลบ:</span>
                      <span className="font-medium">
                        {periodAnalysis.periods.late.count > 0 
                          ? ((periodAnalysis.periods.late.negativeCount / periodAnalysis.periods.late.count) * 100).toFixed(0) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                                backgroundColor: ["#FFD700", "#A8C6FD", "#FFA7A7", "#B1B1B1", "#F0B1FB", "#E3E3E3", "#B3FDC2"],
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
                                  <td className="border px-4 py-3 text-right text-lg">{emotionCounts[emotion]} ครั้ง</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
            
            {/* เพิ่มส่วนการแสดงผลไทม์ไลน์อารมณ์ที่เข้าใจง่ายขึ้น */}
            {periodAnalysis && periodAnalysis.emotionTimeline && periodAnalysis.emotionTimeline.length > 0 && (
  <div className="mt-4 bg-gray-50 p-4 rounded-lg shadow-md">
    <h4 className="text-xl font-semibold mb-2">ไทม์ไลน์อารมณ์ตลอดคาบเรียน</h4>
    <div style={{ height: "300px" }}>
      <Line
        data={{
          labels: periodAnalysis.emotionTimeline.map(item => {
            const time = new Date(item.time);
            return time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          }),
          datasets: [
            {
              label: 'ความสุข',
              data: periodAnalysis.emotionTimeline.map(item => {
                return (item.emotions.Happiness || 0) + (item.emotions.Happy || 0);
              }),
              borderColor: '#FFD700', // สีเหลืองทอง
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
              borderWidth: 3,
              pointRadius: 4,
              tension: 0.3
            },
            {
              label: 'ความเศร้า',
              data: periodAnalysis.emotionTimeline.map(item => {
                return (item.emotions.Sadness || 0) + (item.emotions.Sad || 0);
              }),
              borderColor: '#4682B4', // สีฟ้า
              backgroundColor: 'rgba(70, 130, 180, 0.2)',
              borderWidth: 3,
              pointRadius: 4,
              tension: 0.3
            },
            {
              label: 'ความโกรธ',
              data: periodAnalysis.emotionTimeline.map(item => {
                return (item.emotions.Anger || 0) + (item.emotions.Angry || 0);
              }),
              borderColor: '#FF6347', // สีแดงส้ม
              backgroundColor: 'rgba(255, 99, 71, 0.2)',
              borderWidth: 3,
              pointRadius: 4,
              tension: 0.3
            },
            {
              label: 'ความกลัว',
              data: periodAnalysis.emotionTimeline.map(item => {
                return (item.emotions.Fear || 0) + (item.emotions.Fearful || 0);
              }),
              borderColor: '#9932CC', // สีม่วง
              backgroundColor: 'rgba(153, 50, 204, 0.2)',
              borderWidth: 3,
              pointRadius: 4,
              tension: 0.3
            },
            {
              label: 'ความประหลาดใจ',
              data: periodAnalysis.emotionTimeline.map(item => {
                return (item.emotions.Surprise || 0) + (item.emotions.Surprised || 0);
              }),
              borderColor: '#00CED1', // สีฟ้าอมเขียว
              backgroundColor: 'rgba(0, 206, 209, 0.2)',
              borderWidth: 3,
              pointRadius: 4,
              tension: 0.3
            },
            {
              label: 'เป็นกลาง',
              data: periodAnalysis.emotionTimeline.map(item => {
                return item.emotions.Neutral || 0;
              }),
              borderColor: '#A9A9A9', // สีเทา
              backgroundColor: 'rgba(169, 169, 169, 0.2)',
              borderWidth: 3,
              pointRadius: 4,
              tension: 0.3
            },
            {
              label: 'ความรังเกียจ',
              data: periodAnalysis.emotionTimeline.map(item => {
                return (item.emotions.Disgust || 0) + (item.emotions.Disgusted || 0);
              }),
              borderColor: '#8B4513', // สีน้ำตาล
              backgroundColor: 'rgba(139, 69, 19, 0.2)',
              borderWidth: 3,
              pointRadius: 4,
              tension: 0.3
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                padding: 15,
                font: {
                  size: 12
                },
                usePointStyle: true,
                boxWidth: 8
              }
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#000',
              bodyColor: '#000',
              bodyFont: {
                size: 14
              },
              padding: 12,
              borderColor: '#ddd',
              borderWidth: 1,
              cornerRadius: 6,
              displayColors: true,
              callbacks: {
                title: (context) => {
                  return `เวลา: ${context[0].label}`;
                },
                label: (context) => {
                  return `${context.dataset.label}: ${context.formattedValue} ครั้ง`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'จำนวนนักเรียน (คน)',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                stepSize: 1,
                precision: 0
              }
            },
            x: {
              title: {
                display: true,
                text: 'เวลา',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          }
        }}
      />
    </div>
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-start space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm text-gray-700">กราฟนี้แสดงการเปลี่ยนแปลงของทั้ง 7 อารมณ์พื้นฐานของนักเรียนตลอดคาบเรียน ได้แก่ ความสุข, ความเศร้า, ความโกรธ, ความกลัว, ความประหลาดใจ, เป็นกลาง และความรังเกียจ</p>
          <p className="text-sm text-gray-700 mt-1">อาจารย์สามารถวางเมาส์บนกราฟเพื่อดูข้อมูลทุกอารมณ์ ณ เวลานั้นๆ ได้พร้อมกัน</p>
        </div>
      </div>
    </div>
  </div>
)}
            
            {/* เพิ่มส่วนการวิเคราะห์และข้อเสนอแนะ */}
            <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
              <h4 className="text-xl font-semibold text-indigo-800 mb-2">การวิเคราะห์และข้อเสนอแนะ</h4>
              <ul className="list-disc pl-6 space-y-2">
                {getAnalysisInsights().map((insight, index) => (
                  <li key={index} className="text-gray-800">{insight}</li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={closeModal}
              className="mt-6 py-3 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-lg w-full"
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