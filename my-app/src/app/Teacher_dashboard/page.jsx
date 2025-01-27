'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Line } from 'react-chartjs-2'; // สำหรับกราฟ
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend);

export default function TeacherPage() {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [compareCourse, setCompareCourse] = useState('');
  const [userName, setUserName] = useState('');
  const [courses, setCourses] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCoursePage, setIsCoursePage] = useState(true);
  const [emotionTimestamps, setEmotionTimestamps] = useState([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [currentYearCourses, setCurrentYearCourses] = useState([]);
  const [previousYearCourses, setPreviousYearCourses] = useState([]);
  const [isHidden, setIsHidden] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
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
          borderColor: getColorForEmotion(emotion),
          backgroundColor: 'rgba(0, 0, 0, 0)',
          tension: 0.4,
          fill: false,
        };
      });

      const chartData = {
        labels: [timestamp],
        datasets,
      };

      setGraphData(chartData);
    } catch (err) {
      console.error('Error processing graph data:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const getColorForEmotion = (emotion) => {
    switch (emotion) {
      case 'happy':
        return 'rgba(75, 192, 192, 1)';
      case 'sad':
        return 'rgba(54, 162, 235, 1)';
      case 'angry':
        return 'rgba(255, 99, 132, 1)';
      case 'neutral':
        return 'rgba(153, 102, 255, 1)';
      default:
        return 'rgba(201, 203, 207, 1)';
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
    setSelectedCourse('');
    setSelectedAction('');
    setSelectedTimestamp(null);
  };

  const toggleHidden = () => setIsHidden(!isHidden);
  const startAnalysis = () => setSelectedAction('วิเคราะห์ใบหน้า');
  const viewAnalysis = () => setSelectedAction('ผลวิเคราะห์');
  const compareAnalysis = () => setSelectedAction('เปรียบเทียบผลวิเคราะห์');

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

            {selectedAction === 'ผลวิเคราะห์' && (
              <div>
                <h3 className="text-xl mb-4">เลือกรายการเวลา</h3>
                <div className="grid grid-cols-3 gap-4">
                  {emotionTimestamps.map((item, index) => (
                    <button
                      key={index}
                      className={`p-4 rounded-lg shadow text-left ${
                        selectedTimestamp === item.timestamp
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => fetchGraphData(item.timestamp)}
                    >
                      {item.timestamp} ({item.count})
                    </button>
                  ))}
                </div>

                {loadingGraph ? (
                  <p>Loading graph...</p>
                ) : (
                  graphData && (
                    <div className="mt-6 w-full max-w-4xl mx-auto">
                      <Line 
                        data={graphData} 
                        options={{
                          plugins: {
                            legend: {
                              position: 'right',  // Display the legend to the right of the graph
                              labels: {
                                boxWidth: 10,  // Adjust the box size for each legend item
                                padding: 20     // Add space between the legend and the graph
                              }
                            }
                          }
                        }} 
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
