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
  const [compareWithCourse, setCompareWithCourse] = useState(null);
  const [userName, setUserName] = useState("");
  const [timestamps, setTimestamps] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [emotionData, setEmotionData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comparisonType, setComparisonType] = useState("daily"); // "daily", "monthly", or "yearly"
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const router = useRouter();

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
    
    // รูปแบบ: วัน/เดือน/พ.ศ.
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

  // แปลงปีเป็นรูปแบบไทย (พ.ศ.)
  const formatThaiYear = (year) => {
    if (!year) return "";
    return `พ.ศ. ${parseInt(year) + 543}`;
  };
  
  // เพิ่มฟังก์ชันเพื่อตรวจสอบว่าวันที่อยู่ในเดือนเดียวกันหรือไม่
  const isSameMonth = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.substring(0, 7) === date2.substring(0, 7);
  };
  
  // เพิ่มฟังก์ชันเพื่อตรวจสอบว่าเดือนอยู่ในปีเดียวกันหรือไม่
  const isSameYear = (yearMonth1, yearMonth2) => {
    if (!yearMonth1 || !yearMonth2) return false;
    return yearMonth1.substring(0, 4) === yearMonth2.substring(0, 4);
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
      fetchAvailableYears();
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

      // Extract year-month format (YYYY-MM) from timestamps
      const months = [...new Set(data.map(item => {
        const datePart = item.detection_time.split('T')[0];
        return datePart.substring(0, 7); // Get YYYY-MM part
      }))];
      
      setAvailableMonths(months.sort()); // Sort chronologically
    } catch (error) {
      console.error("Error fetching available months:", error.message);
    }
  };

  const fetchAvailableYears = async () => {
    if (!selectedCourse) return;
    try {
      const { data, error } = await supabase
        .from("emotion_detection")
        .select("detection_time")
        .eq("courses_id", selectedCourse.courses_id);

      if (error) throw error;

      // Extract year format (YYYY) from timestamps
      const years = [...new Set(data.map(item => {
        const datePart = item.detection_time.split('T')[0];
        return datePart.substring(0, 4); // Get YYYY part
      }))];
      
      setAvailableYears(years.sort()); // Sort chronologically
    } catch (error) {
      console.error("Error fetching available years:", error.message);
    }
  };

  const fetchEmotionData = async () => {
    if (comparisonType === "daily" && selectedDates.length !== 2) return;
    if (comparisonType === "monthly" && selectedMonths.length !== 2) return;
    if (comparisonType === "yearly" && selectedYears.length !== 2) return;
    
    try {
      let dataPromises;
      
      if (comparisonType === "daily") {
        dataPromises = selectedDates.map(async (date) => {
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

          return { 
            date, 
            formattedDate: formatThaiDate(date),
            emotions,
            total: data.length 
          };
        });
      } else if (comparisonType === "monthly") { // monthly comparison
        dataPromises = selectedMonths.map(async (yearMonth) => {
          const [year, month] = yearMonth.split('-');
          const nextMonth = month === '12' ? `${parseInt(year) + 1}-01` : `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}`;
          
          const { data, error } = await supabase
            .from("emotion_detection")
            .select("emotion")
            .eq("courses_id", selectedCourse.courses_id)
            .gte("detection_time", `${yearMonth}-01T00:00:00`)
            .lt("detection_time", `${nextMonth}-01T00:00:00`);

          if (error) throw error;
          
          const emotions = {
            Happiness: 0, Sadness: 0, Anger: 0, Fear: 0, Surprise: 0, Neutral: 0, Disgusted: 0
          };
          
          data.forEach((item) => {
            if (item.emotion in emotions) {
              emotions[item.emotion] += 1;
            }
          });

          return { 
            date: yearMonth, 
            formattedDate: formatThaiMonth(yearMonth),
            emotions,
            total: data.length 
          };
        });
      } else { // yearly comparison
        dataPromises = selectedYears.map(async (year) => {
          const nextYear = `${parseInt(year) + 1}`;
          
          const { data, error } = await supabase
            .from("emotion_detection")
            .select("emotion")
            .eq("courses_id", selectedCourse.courses_id)
            .gte("detection_time", `${year}-01-01T00:00:00`)
            .lt("detection_time", `${nextYear}-01-01T00:00:00`);

          if (error) throw error;
          
          const emotions = {
            Happiness: 0, Sadness: 0, Anger: 0, Fear: 0, Surprise: 0, Neutral: 0, Disgusted: 0
          };
          
          data.forEach((item) => {
            if (item.emotion in emotions) {
              emotions[item.emotion] += 1;
            }
          });

          return { 
            date: year, 
            formattedDate: formatThaiYear(year),
            emotions,
            total: data.length 
          };
        });
      }
      
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

  const toggleComparisonType = (type) => {
    setComparisonType(type);
    // Reset selections when switching comparison types
    if (type === "daily") {
      setSelectedMonths([]);
      setSelectedYears([]);
    } else if (type === "monthly") {
      setSelectedDates([]);
      setSelectedYears([]);
    } else {
      setSelectedDates([]);
      setSelectedMonths([]);
    }
  };

  // จัดกลุ่มวันที่ตามเดือน
  const groupDatesByMonth = () => {
    const groups = {};
    timestamps.forEach(date => {
      const yearMonth = date.substring(0, 7); // Get YYYY-MM part
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
      const year = month.substring(0, 4); // Get YYYY part
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(month);
    });
    return groups;
  };

  const dateGroups = groupDatesByMonth();
  const monthGroups = groupMonthsByYear();

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
            className="w-full py-2 px-4 bg-pink-400 active:bg-[#1d2f3f] text-white rounded-lg"
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
            <button 
              onClick={() => toggleComparisonType("yearly")}
              className={`py-2 px-4 rounded-lg ${comparisonType === "yearly" ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              เปรียบเทียบผลวิเคราะห์รายปี
            </button>
           
          </div>
          <div>
    <button 
      onClick={fetchEmotionData} 
      className="bg-sky-600 hover:bg-sky-400 text-white py-2 px-4 rounded-lg"
      disabled={(comparisonType === "daily" && selectedDates.length !== 2) || 
                (comparisonType === "monthly" && selectedMonths.length !== 2) ||
                (comparisonType === "yearly" && selectedYears.length !== 2)}
    >
      แสดงผลเปรียบเทียบ
    </button>
  </div>
          
          
          {comparisonType === "daily" && (
            <>
              <p>กรุณาเลือกวันที่จำนวน 2 วัน</p>
              
              {/* จัดการแสดงผลวันที่แบ่งตามเดือน */}
              {Object.entries(dateGroups)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort by year-month
      .map(([yearMonth, dates]) => (
        <div key={yearMonth} className="mb-4">
          <h4 className="bg-pink-100 px-2 py-1 rounded text-xl font-semibold text-gray-700 mb-4">{formatThaiMonth(yearMonth)}</h4>
          <div className="grid grid-cols-5 gap-4">
            {dates
              .sort((a, b) => a.localeCompare(b)) // Sort days chronologically
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
              
              {/* จัดการแสดงผลเดือนแบ่งตามปี */}
              {Object.entries(monthGroups).map(([year, months]) => (
                <div key={year} className="mb-4">
                  <h4 className="bg-pink-100 px-2 py-1 rounded text-xl font-semibold text-gray-700 mb-4">{formatThaiYear(year)}</h4>
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
          
          {comparisonType === "yearly" && (
            <>
              <p>กรุณาเลือกปีจำนวน 2 ปี</p>
              <div className="grid grid-cols-4 gap-4">
                {availableYears.map((year, index) => (
                  <button 
                    key={index}
                    onClick={() => setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev.slice(-1), year])}
                    className={`block w-full bg-white border py-4 px-6 rounded-lg shadow-md flex items-center space-x-2 transition duration-300
                      ${selectedYears.includes(year) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-300 hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10M4 11h16M4 15h16M4 19h16" />
                    </svg>
                    <span className="text-sl">{formatThaiYear(year)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

        </div>
      </div>

      {showModal && emotionData && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full relative">
            <h3 className="text-2xl font-semibold mb-4">
              กราฟเปรียบเทียบผลการวิเคราะห์อารมณ์ 
              {comparisonType === "daily" ? "รายวัน" : comparisonType === "monthly" ? "รายเดือน" : "รายปี"}
            </h3>
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
            
            <div className="mt-4 grid grid-cols-2 gap-4">
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

export default CompareResultPage;
