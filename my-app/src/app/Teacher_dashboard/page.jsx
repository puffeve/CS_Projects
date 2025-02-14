'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Pie } from 'react-chartjs-2'; // เปลี่ยนเป็นกราฟพาย
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TeacherPage() {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(''); // วิชาที่เลือก
  const [userName, setUserName] = useState('');
  const [courses, setCourses] = useState([]);
  const [isCoursePage, setIsCoursePage] = useState(true);
  const [emotionTimestamps, setEmotionTimestamps] = useState([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [isGraphPopupVisible, setIsGraphPopupVisible] = useState(false); // สถานะการแสดงกราฟป๊อปอัพ
  const [currentYearCourses, setCurrentYearCourses] = useState([]);
  const [previousYearCourses, setPreviousYearCourses] = useState([]);
  const [isHidden, setIsHidden] = useState(false);
  const [compareAcrossCourses, setCompareAcrossCourses] = useState(false); // สำหรับการเลือกเปรียบเทียบข้ามวิชา
  const [otherCourses, setOtherCourses] = useState([]); // สำหรับเก็บวิชาที่เลือกข้ามวิชา
  const router = useRouter();
  const [selectedTimestamps, setSelectedTimestamps] = useState([]); // สำหรับเก็บ timestamps ที่เลือก
  
  
    // ฟังก์ชันในการเลือก timestamp 2 ค่า
    const handleTimestampSelection = (timestamp) => {
      if (selectedTimestamps.length < 2) {
        setSelectedTimestamps([...selectedTimestamps, timestamp]);
      }
    };
  

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      if (user.role === 'teacher') {
        setUserName(user.name);
        fetchCourses(user.user_id);
      } else if (user.role === 'student') {
        setUserName(user.name);
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  

  const fetchCourses = async (userId) => {
    const { data, error } = await supabase
      .from('courses')
      .select('courses_id, namecourses, term, year, user_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      const currentYear = new Date().getFullYear() + 543;
      const currentYearCourses = data.filter((course) => course.year === currentYear);
      const previousYearCourses = data.filter((course) => course.year !== currentYear);

      setCourses(data);
      setCurrentYearCourses(currentYearCourses);
      setPreviousYearCourses(previousYearCourses);
    }
  };

  // ฟังก์ชันดึงข้อมูล timestamp ที่แสดงเวลาในรูปแบบชั่วโมง
  const fetchEmotionTimestamps = async (courseId) => {
    const { data, error } = await supabase
      .from('emotiondata')
      .select('timestamp')
      .eq('courses_id', courseId);
  
    if (error) {
      console.error('Error fetching emotion timestamps:', error);
    } else {
      const groupedTimestamps = data.reduce((acc, item) => {
        // แปลง timestamp เป็นชั่วโมง
        const date = new Date(item.timestamp);
        const hourKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`; // YYYY-MM-DD HH:00
  
        if (!acc[hourKey]) {
          acc[hourKey] = 0;
        }
        acc[hourKey] += 1;
  
        return acc;
      }, {});
  
      // แปลงเป็น array เพื่อนำไปใช้งานง่ายขึ้น
      const groupedTimestampsArray = Object.keys(groupedTimestamps).map((hourKey) => ({
        timestamp: hourKey,
        count: groupedTimestamps[hourKey],
      }));
  
      setEmotionTimestamps(groupedTimestampsArray);
    }
  };
  

// ฟังก์ชันดึงข้อมูลกราฟตาม timestamp ที่เลือก
const fetchGraphData = async () => {
  if (selectedTimestamps.length === 2) {
    const [timestamp1, timestamp2] = selectedTimestamps;

    const { data, error } = await supabase
      .from('emotiondata')
      .select('emotion, percentage, timestamp')
      .in('timestamp', [timestamp1, timestamp2]);

    if (error) {
      console.error('Error fetching graph data:', error);
      return;
    }

    const graphData = processGraphData(data); // ประมวลผลข้อมูลให้เหมาะสมสำหรับการแสดงในกราฟ
    setGraphData(graphData);
  }
};

// ฟังก์ชันในการประมวลผลข้อมูลเพื่อให้เหมาะสมกับกราฟ
const processGraphData = (data) => {
  const labels = ['Emotion 1', 'Emotion 2']; // เพิ่มแสดงในกราฟ
  const emotion1Data = data.filter(item => item.timestamp === selectedTimestamps[0]);
  const emotion2Data = data.filter(item => item.timestamp === selectedTimestamps[1]);

  return {
    labels,
    datasets: [
      {
        label: `Timestamp: ${selectedTimestamps[0]}`,
        data: emotion1Data.map(item => item.percentage),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: `Timestamp: ${selectedTimestamps[1]}`,
        data: emotion2Data.map(item => item.percentage),
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };
};

// ปิดป๊อปอัพกราฟ


const groupByHour = (data) => { //มาใหม่
  // สร้าง object ที่เก็บข้อมูลตามช่วงเวลา (ชั่วโมง)
  const groupedData = {};

  data.forEach(item => {
    // แปลง timestamp เป็น Date
    const date = new Date(item.timestamp);

    // สร้าง key เป็นปี-เดือน-วัน-ชั่วโมง เพื่อให้กลุ่มข้อมูลใน 1 ชั่วโมง
    const hourKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;

    // ตรวจสอบว่ามี key นี้หรือยังใน groupedData
    if (!groupedData[hourKey]) {
      groupedData[hourKey] = [];
    }

    // เพิ่มข้อมูลในกลุ่มที่ตรงกัน
    groupedData[hourKey].push(item);
  });

  return groupedData;
};

const calculateAverage = (groupedData) => { //มาใหม่
  const hourlyAverages = {};

  Object.keys(groupedData).forEach(hourKey => {
    const group = groupedData[hourKey];
    const totalPercentage = group.reduce((sum, item) => sum + item.percentage, 0);
    const average = totalPercentage / group.length;

    hourlyAverages[hourKey] = average;
  });

  console.log('Hourly Averages:', hourlyAverages);
  return hourlyAverages;
};


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setIsCoursePage(false);
    fetchEmotionTimestamps(course.courses_id);
  };

  const handleBackClick = () => {
    setIsCoursePage(true);
    setSelectedCourse(''); // รีเซ็ตวิชาเมื่อกลับ
    setSelectedAction('');
    setSelectedTimestamp(null);
    setCompareAcrossCourses(false); // รีเซ็ตสถานะเมื่อกลับ
    setOtherCourses([]); // ลบวิชาที่เลือกข้ามวิชา
  };

  const toggleHidden = () => setIsHidden(!isHidden);  //ของภีม
  const startAnalysis = () => {
    setSelectedAction('วิเคราะห์ใบหน้า');
    router.push('/analyze_face'); // นำทางไปยังหน้า analyze_face
  };
  const viewAnalysis = () => setSelectedAction('ผลวิเคราะห์');
  const compareAnalysis = () => setSelectedAction('เปรียบเทียบผลวิเคราะห์');

  const toggleGraphPopup = () => {
    setIsGraphPopupVisible(!isGraphPopupVisible); // เปิด/ปิด ป๊อปอัพกราฟ
  };

  const handleComparisonTypeChange = (type) => {
    if (type === 'sameCourse') {
      setCompareAcrossCourses(false);
      fetchEmotionTimestamps(selectedCourse.courses_id); // โหลด timestamp ทันที
    } else if (type === 'acrossCourses') {
      setCompareAcrossCourses(true);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-[#A7C1E2] text-black p-4 relative">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-[#305065] mb-6" />
        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-[#305065] hover:bg-[#243b4d] active:bg-[#1d2f3f] focus:outline-none text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        {isCoursePage ? (
          <>
            <h2 className="text-2xl font-bold mb-4">เลือกรายวิชาก่อนดำเนินการ</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-5 mb-6">
                <h3 className="text-xl mb-4">วิชาปีการศึกษาปัจจุบัน</h3>
                <div className="grid grid-cols-5 gap-4">
                  {currentYearCourses.map((course) => (
                    <button
                      key={course.courses_id}
                      className="bg-white p-4 rounded-lg shadow text-left hover:bg-gray-100"
                      onClick={() => handleCourseClick(course)}
                    >
                      <p>รหัสวิชา: {course.courses_id}</p>
                      <p>ชื่อวิชา: {course.namecourses}</p>
                      <p>ภาคเรียน: {course.term}</p>
                      <p>ปีการศึกษา: {course.year}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleHidden}
                className="mt-4 bg-[#5E929F] hover:bg-[#407481] text-white px-4 py-2 rounded-lg"
              >
                {isHidden ? 'แสดงวิชาปีการศึกษาเก่า' : 'ซ่อนวิชาปีการศึกษาเก่า'}
              </button>


              {!isHidden && previousYearCourses.length > 0 && (
                <div className="col-span-5">
                  <h3 className="text-xl mb-4">วิชาปีการศึกษาเก่า</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {previousYearCourses.map((course) => (
                      <button
                        key={course.courses_id}
                        className="bg-white p-4 rounded-lg shadow text-left hover:bg-gray-100"
                        onClick={() => handleCourseClick(course)}
                      >
                        <p>รหัสวิชา: {course.courses_id}</p>
                        <p>ชื่อวิชา: {course.namecourses}</p>
                        <p>ภาคเรียน: {course.term}</p>
                        <p>ปีการศึกษา: {course.year}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              ตอนนี้อยู่ในวิชา {selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})
            </h2>
            <p>
              ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}
            </p>


            <div className="mt-4 mb-6">
              <button
                onClick={startAnalysis}
                className="bg-[#5E929F] text-white px-4 py-2 rounded-lg mr-4 shadow-md hover:bg-[#407481] transition duration-300"
                >
                วิเคราะห์ใบหน้า
              </button>
              <button 
                onClick={viewAnalysis}
                className="bg-[#5E929F] text-white px-4 py-2 rounded-lg mr-4 shadow-md hover:bg-[#407481] transition duration-300">
                ผลวิเคราะห์
              </button>
              <button
                onClick={compareAnalysis}
                className="bg-[#5E929F] text-white px-4 py-2 rounded-lg mr-4 shadow-md hover:bg-[#407481] transition duration-300"
                >
                เปรียบเทียบผลวิเคราะห์
              </button>
              <button
                onClick={handleBackClick}
                className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-md text-white"
              >
                ย้อนกลับ
              </button>
            </div>


            <h3 className="text-xl mb-4">
              <span className="bg-[#AAC9B9] px-2 py-1 rounded">
              ตอนนี้เลือก: {selectedAction}
              </span>
            </h3>


            {selectedAction === 'เปรียบเทียบผลวิเคราะห์' && ( //ปรับใหม่
  <>
    <h3 className="text-lg mb-4">เลือกประเภทการเปรียบเทียบ</h3>
    <button
      onClick={() => handleComparisonTypeChange('sameCourse')}
      className="bg-[#5E929F] text-white px-4 py-2 rounded-lg mr-4 shadow-md hover:bg-[#407481] transition duration-300"
    >
      เปรียบเทียบในรายวิชาเดียวกัน
    </button>

    <button
      onClick={() => handleComparisonTypeChange('acrossCourses')}
      className="bg-[#5E929F] text-white px-4 py-2 rounded-lg mr-4 shadow-md hover:bg-[#407481] transition duration-300"
    >
      เปรียบเทียบในคนละรายวิชา
    </button>

    {compareAcrossCourses && (
      <div className="mt-4">
        <h3 className="text-lg mb-4">เลือกวิชาที่จะเปรียบเทียบ</h3>
        <div className="grid grid-cols-5 gap-4">
          {courses.filter(course => course.courses_id !== selectedCourse.courses_id).map((course) => (
            <button
              key={course.courses_id}
              onClick={() => setOtherCourses(course.courses_id)}
              className="bg-white p-4 rounded-lg shadow text-left hover:bg-gray-100"
            >
              <p>รหัสวิชา: {course.courses_id}</p>
              <p>ชื่อวิชา: {course.namecourses}</p>
              <p>ภาคเรียน: {course.term}</p>
              <p>ปีการศึกษา: {course.year}</p>
            </button>
          ))}
        </div>
      </div>
    )}
    {/* แสดงเวลาที่เลือกสำหรับการเปรียบเทียบในรายวิชาเดียวกัน */}
    {selectedCourse && !compareAcrossCourses && (
      <div className="mt-4">
        <h3 className="text-lg mb-4">เลือกเวลาที่ต้องการเปรียบเทียบ</h3>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {emotionTimestamps.map((timestamp, index) => (
            <div
              key={timestamp.timestamp}
              className="flex justify-between items-center px-6 py-4 border-b last:border-0 hover:bg-gray-100 cursor-pointer transition duration-200"
              onClick={() => {
                fetchGraphData(timestamp.timestamp);
                toggleGraphPopup(); // เปิดป๊อปอัพเมื่อเลือกเวลา
              }}
            >
              <div className="flex items-center gap-4">
                <div className="bg-[#5E929F] text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <p className="text-lg">วันเวลาที่เลือก: {timestamp.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </>
)}


            {/* ส่วนแสดงการวิเคราะห์และกราฟ */}
            {selectedAction === 'ผลวิเคราะห์' && (
              <div className="mt-4">
              <h3 className="text-lg font-bold mb-4">เลือกเวลาที่ต้องการดูการวิเคราะห์</h3>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {emotionTimestamps.map((timestamp, index) => (
                  <div
                    key={timestamp.timestamp}
                    className="flex justify-between items-center px-6 py-4 border-b last:border-0 hover:bg-gray-100 cursor-pointer transition duration-200"
                    onClick={() => {
                      fetchGraphData(timestamp.timestamp);
                      toggleGraphPopup(); // เปิดป๊อปอัพเมื่อเลือกเวลา
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-[#5E929F] text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-lg">วันเวลาที่เลือก: {timestamp.timestamp}</p>
            
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* ป๊อปอัพกราฟ */}
            {isGraphPopupVisible && (
  <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full relative">
      <button
        onClick={toggleGraphPopup}
        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
      >
        ปิด
      </button>
      <h3 className="text-xl font-bold mb-4">กราฟการวิเคราะห์อารมณ์</h3>
      {selectedTimestamp && (
        <p className="text-lg mb-4">วัน/เวลาที่เลือก: {selectedTimestamp}</p>
      )}
      {graphData && !loadingGraph && (
        <div>
          <Pie data={graphData} options={{ responsive: true }} />
        </div>
      )}
    </div>
  </div>
)}
          </>
        )}
      </div>
    </div>
  );
}
