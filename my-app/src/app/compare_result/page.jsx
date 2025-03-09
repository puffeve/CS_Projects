"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase'; 
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { usePathname } from "next/navigation";

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const CompareResultPage = ({ handleSignOut }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [compareWithCourse, setCompareWithCourse] = useState(null);
  const [userName, setUserName] = useState("");
  const [timestamps, setTimestamps] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [emotionData, setEmotionData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comparisonType, setComparisonType] = useState("daily"); // "daily" or "monthly"
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const router = useRouter();

  // ข้อมูลสำหรับการวิเคราะห์เพิ่มเติม
  const [periodAnalysis, setPeriodAnalysis] = useState([]);
  const [faceCountData, setFaceCountData] = useState([]);
  const [emotionTimelines, setEmotionTimelines] = useState([]);
  const [analysisInsights, setAnalysisInsights] = useState([]);
  
  // เพิ่ม state สำหรับเก็บข้อมูลเรียงตามวันในมุมมองรายเดือน
  const [monthlyDailyTimelines, setMonthlyDailyTimelines] = useState([]);

  const pathname = usePathname();
  const isResultPage = pathname === "/compare_result";
  
  // แปลงชื่ออารมณ์เป็นภาษาไทย
  const emotionTranslation = {
    "Happiness": "ความสุข",
    "Sadness": "ความเศร้า",
    "Anger": "ความโกรธ",
    "Fear": "ความกลัว",
    "Surprise": "ความประหลาดใจ",
    "Neutral": "เป็นกลาง",
    "Disgusted": "ความรังเกียจ"
  };
  
  // แปลงวันที่ให้เป็นรูปแบบไทย (พ.ศ.)
  const formatThaiDate = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const thaiYear = date.getFullYear() + 543;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${thaiYear}`;
  };
  
  // แปลงเดือนเป็นรูปแบบไทย
  const formatThaiMonth = (yearMonth) => {
    if (!yearMonth) return "";
    
    const [year, month] = yearMonth.split('-');
    const thaiYear = parseInt(year) + 543;
    
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    
    return `${thaiMonths[parseInt(month) - 1]} ${thaiYear}`;
  };

  // เพิ่มฟังก์ชันเพื่อตรวจสอบว่าวันที่อยู่ในเดือนเดียวกันหรือไม่
  const isSameMonth = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.substring(0, 7) === date2.substring(0, 7);
  };
  
  useEffect(() => {
    const storedCourse = localStorage.getItem("selectedCourse");
    const compareWithCourseData = localStorage.getItem("compareWithCourse");
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setUserName(user.name);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:", error);
      router.push("/login");
    }

    if (storedCourse) {
      setSelectedCourse(JSON.parse(storedCourse));
    } else {
      router.push("/teacher_dashboard");
    }
    
    if (compareWithCourseData) {
      setCompareWithCourse(JSON.parse(compareWithCourseData));
    }
  }, [router]);

  useEffect(() => {
    if (selectedCourse) {
      fetchTimestamps();
      fetchAvailableMonths();
    }
  }, [selectedCourse]);

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

  const fetchAvailableMonths = async () => {
    if (!selectedCourse) return;
    try {
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("detection_time")
        .eq("courses_id", selectedCourse.courses_id);

      if (error) throw error;

      const months = [...new Set(data.map(item => {
        const datePart = item.detection_time.split('T')[0];
        return datePart.substring(0, 7);
      }))];
      
      setAvailableMonths(months.sort());
    } catch (error) {
      console.error("Error fetching available months:", error.message);
    }
  };

  // เพิ่มฟังก์ชันสำหรับวิเคราะห์ช่วงเวลาของคาบ (ต้นคาบ, กลางคาบ, ท้ายคาบ)
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

  // ฟังก์ชันสำหรับวิเคราะห์ว่าผลลัพธ์นี้บ่งบอกอะไร
  const getAnalysisInsights = (emotionData, emotionCounts, faceCountData) => {
    if (!emotionData || !emotionCounts || !faceCountData) return [];
    
    const insights = [];
    
    // เพิ่มข้อมูลเชิงลึกเกี่ยวกับจำนวนนักเรียน
    if (faceCountData.totalFaces > 0) {
      if (faceCountData.maxFaces - faceCountData.minFaces > 5) {
        insights.push(`มีความแตกต่างของจำนวนนักเรียนในชั่วโมงนี้ค่อนข้างมาก (${faceCountData.minFaces} - ${faceCountData.maxFaces} คน) อาจมีนักเรียนเข้า-ออกระหว่างคาบ`);
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
    
    return insights;
  };

  const fetchEmotionData = async () => {
    if (comparisonType === "daily" && selectedDates.length !== 2) return;
    if (comparisonType === "monthly" && selectedMonths.length !== 2) return;
    
    try {
      let dataPromises;
      const newFaceCountData = [];
      const newPeriodAnalysis = [];
      const newEmotionTimelines = [];
      const newAnalysisInsights = [];
      const newMonthlyDailyTimelines = [];
      
      if (comparisonType === "daily") {
        dataPromises = selectedDates.map(async (date) => {
          const startOfDay = new Date(date + 'T00:00:00');
          const endOfDay = new Date(date + 'T23:59:59');
          
          const { data, error } = await supabase
            .from("emotion_detection")
            .select("emotion, num_faces, detection_time")
            .eq("courses_id", selectedCourse.courses_id)
            .gte("detection_time", startOfDay.toISOString())
            .lt("detection_time", endOfDay.toISOString());

          if (error) throw error;
          
          // Process period analysis
          const periodResult = analyzePeriods(data, startOfDay.toISOString(), endOfDay.toISOString());
          newPeriodAnalysis.push(periodResult);
          
          // Calculate face count data
          let totalFaces = 0;
          let faceCounts = [];
          data.forEach(item => {
            if (item.num_faces !== null && item.num_faces !== undefined) {
              faceCounts.push(item.num_faces);
              totalFaces += item.num_faces;
            }
          });
          
          const maxFaces = faceCounts.length > 0 ? Math.max(...faceCounts) : 0;
          const minFaces = faceCounts.length > 0 ? Math.min(...faceCounts) : 0;
          
          newFaceCountData.push({
            totalFaces,
            maxFaces,
            minFaces
          });
          
          // Calculate emotion counts for analysis insights
          const emotions = {
            Happy: 0, Sad: 0, Angry: 0, Fearful: 0, Surprised: 0, Neutral: 0, Disgusted: 0
          };
          
          const emotionMapping = {
            'Happiness': 'Happy', 'Sadness': 'Sad', 'Anger': 'Angry',
            'Fear': 'Fearful', 'Surprise': 'Surprised', 'Neutral': 'Neutral',
            'Disgusted': 'Disgusted'
          };
          
          data.forEach(item => {
            const mappedEmotion = emotionMapping[item.emotion] || item.emotion;
            if (mappedEmotion in emotions) {
              emotions[mappedEmotion] += 1;
            }
          });
          
          const emotionPercentages = {};
          const totalDetections = data.length;
          
          for (const emotion in emotions) {
            const percent = totalDetections > 0 ? (emotions[emotion] / totalDetections) * 100 : 0;
            emotionPercentages[emotion] = parseFloat(percent.toFixed(1));
          }
          
          // Generate insights
          newAnalysisInsights.push(getAnalysisInsights(emotionPercentages, emotions, {
            totalFaces,
            maxFaces,
            minFaces
          }));
          
          // Process emotions by date
          const emotions_data = {
            Happiness: 0, Sadness: 0, Anger: 0, Fear: 0, Surprise: 0, Neutral: 0, Disgusted: 0
          };
          
          data.forEach((item) => {
            if (item.emotion in emotions_data) {
              emotions_data[item.emotion] += 1;
            }
          });

          return { 
            date, 
            formattedDate: formatThaiDate(date),
            emotions: emotions_data,
            total: data.length
          };
        });
      } else if (comparisonType === "monthly") {
        dataPromises = selectedMonths.map(async (yearMonth) => {
          const [year, month] = yearMonth.split('-');
          const nextMonth = month === '12' ? `${parseInt(year) + 1}-01` : `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}`;
          
          const startOfMonth = new Date(`${yearMonth}-01T00:00:00`);
          const endOfMonth = new Date(`${nextMonth}-01T00:00:00`);
          endOfMonth.setMilliseconds(endOfMonth.getMilliseconds() - 1);
          
          const { data, error } = await supabase
            .from("emotion_detection")
            .select("emotion, num_faces, detection_time")
            .eq("courses_id", selectedCourse.courses_id)
            .gte("detection_time", startOfMonth.toISOString())
            .lt("detection_time", endOfMonth.toISOString());

          if (error) throw error;
          
          // สำหรับมุมมองรายเดือน - จัดกลุ่มข้อมูลตามวัน
          const groupedByDay = {};
          
          data.forEach(item => {
            const date = new Date(item.detection_time);
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!groupedByDay[dayKey]) {
              groupedByDay[dayKey] = {
                date: dayKey,
                items: [],
                emotions: {
                  Happiness: 0, Sadness: 0, Anger: 0, Fear: 0, Surprise: 0, Neutral: 0, Disgusted: 0
                }
              };
            }
            
            groupedByDay[dayKey].items.push(item);
            
            if (item.emotion in groupedByDay[dayKey].emotions) {
              groupedByDay[dayKey].emotions[item.emotion]++;
            }
          });
          
          // แปลงเป็น array และเรียงตามวันที่
          const dailyTimeline = Object.values(groupedByDay).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
          );
          
          newMonthlyDailyTimelines.push(dailyTimeline);
          
          // Process period analysis
          const periodResult = analyzePeriods(data, startOfMonth.toISOString(), endOfMonth.toISOString());
          newPeriodAnalysis.push(periodResult);
          
          // ส่วนข้อมูลใบหน้า
          let totalFaces = 0;
          let faceCounts = [];
          data.forEach(item => {
            if (item.num_faces !== null && item.num_faces !== undefined) {
              faceCounts.push(item.num_faces);
              totalFaces += item.num_faces;
            }
          });
          
          const maxFaces = faceCounts.length > 0 ? Math.max(...faceCounts) : 0;
          const minFaces = faceCounts.length > 0 ? Math.min(...faceCounts) : 0;
          
          newFaceCountData.push({
            totalFaces,
            maxFaces,
            minFaces
          });
          
          // Calculate emotion counts for analysis insights
          const emotions = {
            Happy: 0, Sad: 0, Angry: 0, Fearful: 0, Surprised: 0, Neutral: 0, Disgusted: 0
          };
          
          const emotionMapping = {
            'Happiness': 'Happy', 'Sadness': 'Sad', 'Anger': 'Angry',
            'Fear': 'Fearful', 'Surprise': 'Surprised', 'Neutral': 'Neutral',
            'Disgusted': 'Disgusted'
          };
          
          data.forEach(item => {
            const mappedEmotion = emotionMapping[item.emotion] || item.emotion;
            if (mappedEmotion in emotions) {
              emotions[mappedEmotion] += 1;
            }
          });
          
          const emotionPercentages = {};
          const totalDetections = data.length;
          
          for (const emotion in emotions) {
            const percent = totalDetections > 0 ? (emotions[emotion] / totalDetections) * 100 : 0;
            emotionPercentages[emotion] = parseFloat(percent.toFixed(1));
          }
          
          // Generate insights
          newAnalysisInsights.push(getAnalysisInsights(emotionPercentages, emotions, {
            totalFaces,
            maxFaces,
            minFaces
          }));
          
          // Process emotions
          const emotions_data = {
            Happiness: 0, Sadness: 0, Anger: 0, Fear: 0, Surprise: 0, Neutral: 0, Disgusted: 0
          };
          
          data.forEach((item) => {
            if (item.emotion in emotions_data) {
              emotions_data[item.emotion] += 1;
            }
          });

          return { 
            date: yearMonth, 
            formattedDate: formatThaiMonth(yearMonth),
            emotions: emotions_data,
            total: data.length 
          };
        });
      }
      
      const result = await Promise.all(dataPromises);
      setEmotionData(result);
      setPeriodAnalysis(newPeriodAnalysis);
      setFaceCountData(newFaceCountData);
      setAnalysisInsights(newAnalysisInsights);
      setMonthlyDailyTimelines(newMonthlyDailyTimelines);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching emotion data:", error.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const toggleComparisonType = (type) => {
    setComparisonType(type);
    // Reset selections when switching comparison types
    if (type === "daily") {
      setSelectedMonths([]);
    } else if (type === "monthly") {
      setSelectedDates([]);
    }
  };

  // จัดกลุ่มวันที่ตามเดือน
  const groupDatesByMonth = () => {
    const groups = {};
    timestamps.forEach(date => {
      const yearMonth = date.substring(0, 7);
      if (!groups[yearMonth]) {
        groups[yearMonth] = [];
      }
      groups[yearMonth].push(date);
    });
    return groups;
  };

  // จัดกลุ่มเดือนตามปี
  const groupMonthsByYear = () => {
    const groups = {};
    availableMonths.forEach(month => {
      const year = month.substring(0, 4);
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(month);
    });
    return groups;
  };

  // เรียกใช้ฟังก์ชันเพื่อจัดกลุ่มวันที่และเดือน
  const dateGroups = groupDatesByMonth();
  const monthGroups = groupMonthsByYear();

  const formatDateTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('th-TH');
    } catch (error) {
      console.error('Error formatting date:', error);
      return isoString || '';
    }
  };

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
        
        <div className="sticky bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-red-400 active:bg-[#1d2f3f] focus:outline-none text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {selectedCourse ? (
          <h2 className="text-2xl font-bold mb-4">
            ตอนนี้อยู่ในวิชา <span className="text-pink-500">{selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})</span>
          </h2>
        ) : (
          <h2 className="text-2xl font-bold mb-4">กำลังโหลดข้อมูลวิชา...</h2>
        )}
        {selectedCourse && (
          <p className="text-lg">ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}</p>
        )}

        {isResultPage && (
          <h3 className="text-xl mt-4 mb-4">
            <span className="bg-pink-200 px-2 py-1 rounded">
              ตอนนี้อยู่ในหน้าเปรียบเทียบผลวิเคราะห์ในรายวิชาเดียวกัน
            </span>
          </h3>
        )}
        
        {/* คำอธิบายประโยชน์ของผลวิเคราะห์ */}
        <div className="bg-blue-50 p-4 my-4 rounded-lg shadow border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">ประโยชน์ของการเปรียบเทียบผลการวิเคราะห์อารมณ์</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>เปรียบเทียบอารมณ์ของผู้เรียนระหว่างช่วงเวลาที่แตกต่างกัน เช่น วันต่างๆ เดือนต่างๆ หรือปีต่างๆ</li>
            <li>ประเมินพัฒนาการของการเรียนการสอนผ่านการเปลี่ยนแปลงของอารมณ์ผู้เรียน</li>
            <li>วิเคราะห์ผลกระทบของการปรับเทคนิคการสอนในช่วงเวลาที่แตกต่างกัน</li>
            <li>ระบุแนวโน้มระยะยาวของอารมณ์ผู้เรียนในรายวิชาเดียวกัน</li>
            <li>ช่วยในการตัดสินใจปรับปรุงเนื้อหาและรูปแบบการสอนให้เหมาะสมยิ่งขึ้น</li>
          </ul>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="flex space-x-4 mb-4">
            <button 
              onClick={() => toggleComparisonType("daily")}
              className={`py-2 px-4 rounded-lg ${comparisonType === "daily" ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              เปรียบเทียบผลวิเคราะห์รายวัน
            </button>
            <button 
              onClick={() => toggleComparisonType("monthly")}
              className={`py-2 px-4 rounded-lg ${comparisonType === "monthly" ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              เปรียบเทียบผลวิเคราะห์รายเดือน
            </button>
          </div>
          <div>
            <button 
              onClick={fetchEmotionData} 
              className="bg-sky-600 hover:bg-sky-400 text-white py-2 px-4 rounded-lg"
              disabled={(comparisonType === "daily" && selectedDates.length !== 2) || (comparisonType === "monthly" && selectedMonths.length !== 2)}
            >
              แสดงผลเปรียบเทียบ
            </button>
          </div>
          
          {comparisonType === "daily" && (
            <>
              <p>กรุณาเลือกวันที่จำนวน 2 วัน</p>
              
              {Object.entries(dateGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([yearMonth, dates]) => (
                  <div key={yearMonth} className="mb-4">
                    <h4 className="bg-pink-100 px-2 py-1 rounded text-xl font-semibold text-gray-700 mb-4">{formatThaiMonth(yearMonth)}</h4>
                    <div className="grid grid-cols-5 gap-4">
                      {dates
                        .sort((a, b) => a.localeCompare(b))
                        .map((date, index) => (
                          <button 
                            key={index}
                            onClick={() => setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev.slice(-1), date])}
                            className={`block w-full bg-white border py-4 px-8 rounded-lg shadow-md flex items-center space-x-2 transition duration-300
                              ${selectedDates.includes(date) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-300 hover:bg-gray-100'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10M4 11h16M4 15h16M4 19h16" />
                            </svg>
                            <span className="text-sl">วันที่ : {formatThaiDate(date)}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
            </>
          )}
          
          {comparisonType === "monthly" && (
            <>
              <p>กรุณาเลือกเดือนจำนวน 2 เดือน</p>
              
              {Object.entries(monthGroups).map(([year, months]) => (
                <div key={year} className="mb-4">
                  <h4 className="bg-pink-100 px-2 py-1 rounded text-xl font-semibold text-gray-700 mb-4">{parseInt(year) + 543} (พ.ศ.)</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {months.map((yearMonth, index) => (
                      <button 
                        key={index}
                        onClick={() => setSelectedMonths(prev => prev.includes(yearMonth) ? prev.filter(m => m !== yearMonth) : [...prev.slice(-1), yearMonth])}
                        className={`block w-full bg-white border py-4 px-6 rounded-lg shadow-md flex items-center space-x-2 transition duration-300
                          ${selectedMonths.includes(yearMonth) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-300 hover:bg-gray-100'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10M4 11h16M4 15h16M4 19h16" />
                        </svg>
                        <span className="text-sl">{formatThaiMonth(yearMonth)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {showModal && emotionData && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-6xl w-full relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-semibold mb-4">
              กราฟเปรียบเทียบผลการวิเคราะห์อารมณ์ 
              {comparisonType === "daily" ? "รายวัน" : "รายเดือน"}
            </h3>
            
            {/* ส่วนแสดงข้อมูลจำนวนใบหน้า */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {emotionData.map((data, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-blue-800 font-semibold mb-2">{data.formattedDate}</h4>
                  <div className="flex flex-wrap gap-3">
                    <div className="text-center bg-white p-2 rounded-lg shadow flex-1">
                      <h5 className="text-blue-600 font-semibold">จำนวนการตรวจจับอารมณ์ทั้งหมด</h5>
                      <p className="text-2xl font-bold">{faceCountData[index]?.totalFaces || 0} ครั้ง</p>
                    </div>
                    <div className="text-center bg-white p-2 rounded-lg shadow flex-1">
                      <h5 className="text-blue-600 font-semibold">จำนวนใบหน้าสูงสุด</h5>
                      <p className="text-2xl font-bold">{faceCountData[index]?.maxFaces || 0} ใบหน้า</p>
                    </div>
                    <div className="text-center bg-white p-2 rounded-lg shadow flex-1">
                      <h5 className="text-blue-600 font-semibold">จำนวนใบหน้าต่ำสุด</h5>
                      <p className="text-2xl font-bold">{faceCountData[index]?.minFaces || 0} ใบหน้า</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ส่วนอธิบายการคำนวณอารมณ์เพื่อความเข้าใจของผู้ใช้ */}
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
            </div>

            {/* แสดงจุดพีคของอารมณ์ด้านลบ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {periodAnalysis.map((analysis, index) => (
                analysis && analysis.negativeEmotionPeaks && analysis.negativeEmotionPeaks.length > 0 && (
                  <div key={index} className="bg-amber-50 p-3 rounded-lg">
                    <h4 className="text-amber-800 font-semibold text-lg mb-2">การวิเคราะห์ช่วงเวลาที่มีอารมณ์ด้านลบ - {emotionData[index].formattedDate}</h4>
                    <div className="space-y-2">
                      {analysis.negativeEmotionPeaks.map((peak, peakIndex) => {
                        const startTime = new Date(peak.startTime);
                        const endTime = new Date(peak.endTime);
                        
                        // ปรับรูปแบบการแสดงผลสำหรับมุมมองรายเดือน
                        let timeDisplay;
                        if (comparisonType === "monthly") {
                          const day = startTime.getDate();
                          const month = startTime.toLocaleString('th-TH', { month: 'long' });
                          const year = startTime.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
                          
                          timeDisplay = `วันที่ ${day} ${month} พ.ศ. ${year} เวลา ${startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} ถึง ${endTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
                        } else {
                          timeDisplay = `${startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} ถึง ${endTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
                        }
                        
                        return (
                          <div key={peakIndex} className="bg-white p-3 rounded-lg shadow border-l-4 border-amber-500">
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
                                <span className="font-medium">ช่วงเวลา:</span> {timeDisplay}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* แสดงการเปรียบเทียบช่วงคาบเรียน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {periodAnalysis.map((analysis, index) => (
                analysis && analysis.periods && (
                  <div key={index} className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-green-800 font-semibold text-lg mb-2">การวิเคราะห์ตามช่วงคาบเรียน - {emotionData[index].formattedDate}</h4>
                    
                    <div className="mb-4" style={{ height: "200px" }}>
                      <Bar
                        data={{
                          labels: ['ต้นคาบ', 'กลางคาบ', 'ท้ายคาบ'],
                          datasets: [
                            {
                              label: 'จำนวนการตรวจจับอารมณ์จากใบหน้าของนักเรียนทั้งหมด',
                              data: [
                                analysis.periods.early.faces,
                                analysis.periods.middle.faces,
                                analysis.periods.late.faces
                              ],
                              backgroundColor: 'rgba(54, 162, 235, 0.7)',
                              borderColor: 'rgba(54, 162, 235, 1)',
                              borderWidth: 1
                            },
                            {
                              label: 'อารมณ์ด้านลบ จากจำนวนการตรวจจับอารมณ์จากใบหน้า',
                              data: [
                                analysis.periods.early.negativeCount,
                                analysis.periods.middle.negativeCount,
                                analysis.periods.late.negativeCount
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
                  </div>
                )
              ))}
            </div>

            {/* แสดงไทม์ไลน์อารมณ์ - แยกตามประเภทการเปรียบเทียบ */}
            {comparisonType === "monthly" && monthlyDailyTimelines.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {monthlyDailyTimelines.map((dailyTimeline, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-gray-800 font-semibold text-lg mb-2">ไทม์ไลน์อารมณ์รายวัน - {emotionData[index].formattedDate}</h4>
                    <div style={{ height: "200px" }}>
                      <Line
                        data={{
                          labels: dailyTimeline.map(day => {
                            const date = new Date(day.date);
                            return `วันที่ ${date.getDate()}`;
                          }),
                          datasets: [
                            {
                              label: 'ความสุข',
                              data: dailyTimeline.map(day => day.emotions.Happiness || 0),
                              borderColor: '#FFD700',
                              backgroundColor: 'rgba(255, 215, 0, 0.2)',
                              borderWidth: 2,
                              pointRadius: 3,
                              tension: 0.3
                            },
                            {
                              label: 'ความเศร้า',
                              data: dailyTimeline.map(day => day.emotions.Sadness || 0),
                              borderColor: '#4682B4',
                              backgroundColor: 'rgba(70, 130, 180, 0.2)',
                              borderWidth: 2,
                              pointRadius: 3,
                              tension: 0.3
                            },
                            {
                              label: 'ความโกรธ',
                              data: dailyTimeline.map(day => day.emotions.Anger || 0),
                              borderColor: '#FF6347',
                              backgroundColor: 'rgba(255, 99, 71, 0.2)',
                              borderWidth: 2,
                              pointRadius: 3,
                              tension: 0.3
                            },
                            {
                              label: 'ความกลัว',
                              data: dailyTimeline.map(day => day.emotions.Fear || 0),
                              borderColor: '#9932CC',
                              backgroundColor: 'rgba(153, 50, 204, 0.2)',
                              borderWidth: 2,
                              pointRadius: 3,
                              tension: 0.3
                            },
                            {
                              label: 'ความประหลาดใจ',
                              data: dailyTimeline.map(day => day.emotions.Surprise || 0),
                              borderColor: '#00CED1',
                              backgroundColor: 'rgba(0, 206, 209, 0.2)',
                              borderWidth: 2,
                              pointRadius: 3,
                              tension: 0.3
                            },
                            {
                              label: 'เป็นกลาง',
                              data: dailyTimeline.map(day => day.emotions.Neutral || 0),
                              borderColor: '#A9A9A9',
                              backgroundColor: 'rgba(169, 169, 169, 0.2)',
                              borderWidth: 2,
                              pointRadius: 3,
                              tension: 0.3
                            },
                            {
                              label: 'ความรังเกียจ',
                              data: dailyTimeline.map(day => day.emotions.Disgusted || 0),
                              borderColor: '#8B4513',
                              backgroundColor: 'rgba(139, 69, 19, 0.2)',
                              borderWidth: 2,
                              pointRadius: 3,
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
                                padding: 10,
                                font: {
                                  size: 10
                                },
                                usePointStyle: true,
                                boxWidth: 6
                              }
                            },
                            tooltip: {
                              callbacks: {
                                title: (context) => {
                                  const dayIndex = context[0].dataIndex;
                                  const day = dailyTimeline[dayIndex];
                                  return formatThaiDate(day.date);
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
                              ticks: {
                                stepSize: 1,
                                precision: 0
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
                  </div>
                ))}
              </div>
            )}
            
            {comparisonType === "daily" && periodAnalysis.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {periodAnalysis.map((analysis, index) => (
                  analysis && analysis.emotionTimeline && analysis.emotionTimeline.length > 0 && (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-gray-800 font-semibold text-lg mb-2">ไทม์ไลน์อารมณ์ - {emotionData[index].formattedDate}</h4>
                      <div style={{ height: "200px" }}>
                        <Line
                          data={{
                            labels: analysis.emotionTimeline.map(item => {
                              const time = new Date(item.time);
                              return time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                            }),
                            datasets: [
                              {
                                label: 'ความสุข',
                                data: analysis.emotionTimeline.map(item => {
                                  return (item.emotions.Happiness || 0) + (item.emotions.Happy || 0);
                                }),
                                borderColor: '#FFD700',
                                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                                borderWidth: 2,
                                pointRadius: 3,
                                tension: 0.3
                              },
                              {
                                label: 'ความเศร้า',
                                data: analysis.emotionTimeline.map(item => {
                                  return (item.emotions.Sadness || 0) + (item.emotions.Sad || 0);
                                }),
                                borderColor: '#4682B4',
                                backgroundColor: 'rgba(70, 130, 180, 0.2)',
                                borderWidth: 2,
                                pointRadius: 3,
                                tension: 0.3
                              },
                              {
                                label: 'ความโกรธ',
                                data: analysis.emotionTimeline.map(item => {
                                  return (item.emotions.Anger || 0) + (item.emotions.Angry || 0);
                                }),
                                borderColor: '#FF6347',
                                backgroundColor: 'rgba(255, 99, 71, 0.2)',
                                borderWidth: 2,
                                pointRadius: 3,
                                tension: 0.3
                              },
                              {
                                label: 'ความกลัว',
                                data: analysis.emotionTimeline.map(item => {
                                  return (item.emotions.Fear || 0) + (item.emotions.Fearful || 0);
                                }),
                                borderColor: '#9932CC',
                                backgroundColor: 'rgba(153, 50, 204, 0.2)',
                                borderWidth: 2,
                                pointRadius: 3,
                                tension: 0.3
                              },
                              {
                                label: 'ความประหลาดใจ',
                                data: analysis.emotionTimeline.map(item => {
                                  return (item.emotions.Surprise || 0) + (item.emotions.Surprised || 0);
                                }),
                                borderColor: '#00CED1',
                                backgroundColor: 'rgba(0, 206, 209, 0.2)',
                                borderWidth: 2,
                                pointRadius: 3,
                                tension: 0.3
                              },
                              {
                                label: 'เป็นกลาง',
                                data: analysis.emotionTimeline.map(item => {
                                  return item.emotions.Neutral || 0;
                                }),
                                borderColor: '#A9A9A9',
                                backgroundColor: 'rgba(169, 169, 169, 0.2)',
                                borderWidth: 2,
                                pointRadius: 3,
                                tension: 0.3
                              },
                              {
                                label: 'ความรังเกียจ',
                                data: analysis.emotionTimeline.map(item => {
                                  return (item.emotions.Disgust || 0) + (item.emotions.Disgusted || 0);
                                }),
                                borderColor: '#8B4513',
                                backgroundColor: 'rgba(139, 69, 19, 0.2)',
                                borderWidth: 2,
                                pointRadius: 3,
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
                                  padding: 10,
                                  font: {
                                    size: 10
                                  },
                                  usePointStyle: true,
                                  boxWidth: 6
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    return `${context.dataset.label}: ${context.formattedValue} ครั้ง`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1,
                                  precision: 0
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
                    </div>
                  )
                ))}
              </div>
            )}

            <h3 className="text-2xl font-semibold mb-4">กราฟเปรียบเทียบอารมณ์</h3>
            <Bar 
              data={{
                labels: ["ความสุข", "ความเศร้า", "ความโกรธ", "ความกลัว", "ความประหลาดใจ", "เป็นกลาง", "ความรังเกียจ"],
                datasets: emotionData.map((data, index) => ({
                  label: `${data.formattedDate} (รวม ${data.total} ครั้ง)`,
                  data: Object.values(data.emotions).map(count => ((count / data.total) * 100).toFixed(1)),
                  backgroundColor: index === 0 ? "#8884d8" : "#82ca9d",
                }))
              }}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'เปอร์เซ็นต์'
                    }
                  }
                }
              }}
            />
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {emotionData.map((data, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{data.formattedDate}</h4>
                  <p>จำนวนการตรวจจับทั้งหมด: {data.total} ครั้ง</p>
                  {Object.entries(data.emotions).map(([emotion, count]) => (
                    <p key={emotion}>
                      {emotionTranslation[emotion]}: {count} ({((count / data.total) * 100).toFixed(1)}%)
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* เพิ่มส่วนการวิเคราะห์และข้อเสนอแนะ */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisInsights.map((insights, index) => (
                <div key={index} className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-xl font-semibold text-indigo-800 mb-2">การวิเคราะห์และข้อเสนอแนะ - {emotionData[index].formattedDate}</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    {insights.map((insight, insightIndex) => (
                      <li key={insightIndex} className="text-gray-800">{insight}</li>
                    ))}
                  </ul>
                </div>
              ))}
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

export default CompareResultPage;