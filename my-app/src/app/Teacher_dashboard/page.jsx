'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Pie } from 'react-chartjs-2'; // เปลี่ยนเป็นกราฟพาย
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

  const fetchEmotionTimestamps = async (courseId) => {
    const { data, error } = await supabase
      .from('emotiondata')
      .select('timestamp')
      .eq('courses_id', courseId);

    if (error) {
      console.error('Error fetching emotion timestamps:', error);
    } else {
      const groupedTimestamps = data.reduce((acc, item) => {
        const timestamp = item.timestamp;
        if (!acc[timestamp]) {
          acc[timestamp] = 0;
        }
        acc[timestamp] += 1;
        return acc;
      }, {});

      const groupedTimestampsArray = Object.keys(groupedTimestamps).map((timestamp) => ({
        timestamp,
        count: groupedTimestamps[timestamp],
      }));

      setEmotionTimestamps(groupedTimestampsArray);
    }
  };

  const fetchGraphData = async (timestamp) => {
    setLoadingGraph(true);
    setSelectedTimestamp(timestamp);

    try {
      const { data, error } = await supabase
        .from('emotiondata')
        .select('emotion, percentage')
        .eq('timestamp', timestamp);

      if (error) {
        console.error('Error fetching graph data:', error);
        return;
      }

      const labels = Array.from(new Set(data.map((item) => item.emotion)));
      const datasets = labels.map((emotion) => {
        const emotionData = data.filter((item) => item.emotion === emotion);
        return {
          label: emotion,
          data: emotionData.map((item) => item.percentage),
        };
      });

      const chartData = {
        labels: labels,
        datasets: [{
          data: datasets.map((item) => item.data.reduce((a, b) => a + b, 0)),
          backgroundColor: ['rgba(0, 0, 128, 1)', 'rgba(128, 0, 128, 1)', 'rgba(255, 99, 132, 1)', 'rgba(128, 0, 128, 1)'],
        }],
      };

      setGraphData(chartData);
    } catch (err) {
      console.error('Error processing graph data:', err);
    } finally {
      setLoadingGraph(false);
    }
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

  const toggleHidden = () => setIsHidden(!isHidden);
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
    } else if (type === 'acrossCourses') {
      setCompareAcrossCourses(true);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-sky-200 text-black p-4 relative">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-sky-300 mb-6" />
        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-pink-400 hover:bg-pink-500 active:bg-pink-600 focus:outline-none text-black rounded-lg"
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
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
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
                className="bg-green-500 text-white px-4 py-2 rounded-lg mr-4"
              >
                วิเคราะห์ใบหน้า
              </button>
              <button
                onClick={viewAnalysis}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg mr-4"
              >
                ผลวิเคราะห์
              </button>
              <button
                onClick={compareAnalysis}
                className="bg-red-500 text-white px-4 py-2 rounded-lg mr-4"
              >
                เปรียบเทียบผลวิเคราะห์
              </button>
              <button
                onClick={handleBackClick}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-md"
              >
                ย้อนกลับ
              </button>
            </div>
            <h3 className="text-xl mb-4">ตอนนี้เลือก: {selectedAction}</h3>


            {selectedAction === 'เปรียบเทียบผลวิเคราะห์' && (
              <>
                <h3 className="text-lg mb-4">เลือกประเภทการเปรียบเทียบ</h3>
                <button
                  onClick={() => handleComparisonTypeChange('sameCourse')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-4"
                >
                  เปรียบเทียบในรายวิชาเดียวกัน
                </button>
                
              
        
                
                <button
                  onClick={() => handleComparisonTypeChange('acrossCourses')}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg"
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
              </>
            )}
            {/* ส่วนแสดงการวิเคราะห์และกราฟ */}
            {selectedAction === 'ผลวิเคราะห์' && (
              <div>
                <h3 className="text-lg mb-4">เลือกเวลาที่ต้องการดูการวิเคราะห์</h3>
                <div className="grid grid-cols-5 gap-4">
                  {emotionTimestamps.map((timestamp) => (
                    <button
                      key={timestamp.timestamp}
                      className="bg-white p-4 rounded-lg shadow text-left hover:bg-gray-100"
                      onClick={() => {
                        fetchGraphData(timestamp.timestamp);
                        toggleGraphPopup(); // เปิดป๊อปอัพเมื่อเลือกเวลา
                      }}
                    >
                      <p>วัน/เวลาที่เลือก: {timestamp.timestamp}</p>
  
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ป๊อปอัพกราฟ */}
            {isGraphPopupVisible && (
              <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl  w-full relative">
                  <button
                    onClick={toggleGraphPopup}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                  >
                    ปิด
                  </button>
                  <h3 className="text-xl font-bold mb-4">กราฟการวิเคราะห์อารมณ์</h3>
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
