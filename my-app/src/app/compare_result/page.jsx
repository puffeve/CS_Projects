"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CompareResultPage = ({ handleSignOut, handleBackClick }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userName, setUserName] = useState("");
  const [timestamps, setTimestamps] = useState([]);
  const [selectedTimestamp1, setSelectedTimestamp1] = useState(null);
  const [selectedTimestamp2, setSelectedTimestamp2] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseForComparison, setSelectedCourseForComparison] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comparisonData1, setComparisonData1] = useState([]);
  const [comparisonData2, setComparisonData2] = useState([]);
  const router = useRouter();
  const pathname = usePathname();
  const isResultPage = pathname === "/compare_result";

  const formatData = (emotions) => {
    if (!emotions || emotions.length === 0) return {};
    
    const emotionGroups = {};
    emotions.forEach((item) => {
      if (!item || !item.emotion || typeof item.percentage !== 'number') return;
      
      if (!emotionGroups[item.emotion]) {
        emotionGroups[item.emotion] = parseFloat(item.percentage);
        emotionGroups[`${item.emotion}_count`] = 1;
      } else {
        const currentTotal = emotionGroups[item.emotion] * emotionGroups[`${item.emotion}_count`];
        const newCount = emotionGroups[`${item.emotion}_count`] + 1;
        emotionGroups[item.emotion] = (currentTotal + parseFloat(item.percentage)) / newCount;
        emotionGroups[`${item.emotion}_count`] = newCount;
      }
    });

    // Remove count properties
    Object.keys(emotionGroups).forEach(key => {
      if (key.endsWith('_count')) {
        delete emotionGroups[key];
      }
    });

    console.log('Formatted Data:', emotionGroups);
    return emotionGroups;
  };

  const parseDateString = (thaiDateString) => {
    const [datePart, timePart] = thaiDateString.split('เวลา');
    const [day, month, year] = datePart.trim().split(' ');
    
    const monthMap = {
      'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
      'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
      'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
    };
    
    const [hours] = timePart.trim().split(':');
    
    const date = new Date();
    date.setFullYear(parseInt(year) - 543);
    date.setMonth(monthMap[month]);
    date.setDate(parseInt(day));
    date.setHours(parseInt(hours), 0, 0, 0);
    
    return date;
  };

  const fetchUserCourses = async (teacherName) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('name_teacher', teacherName);

      if (error) {
        console.error('Error fetching teacher courses:', error);
        return;
      }
      
      console.log('Teacher courses:', data);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
    }
  };

  const fetchTimestamps = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('emotiondata')
        .select('timestamp')
        .eq('courses_id', courseId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching timestamps:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No timestamp data found for the selected course.');
        setTimestamps([]);
        return;
      }

      const groupedData = data.reduce((acc, item) => {
        const date = new Date(item.timestamp);
        const hourKey = date.toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit'
        });

        const displayTime = date.toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(':00', ':00 น.');

        if (!acc[hourKey]) {
          acc[hourKey] = displayTime;
        }
        return acc;
      }, {});

      const groupedTimestamps = Object.values(groupedData);
      setTimestamps(groupedTimestamps);
    } catch (error) {
      console.error('Error fetching timestamps:', error);
    }
  };

  const handleCompare = async () => {
    if (selectedTimestamp1 && selectedTimestamp2) {
      try {
        const date1 = parseDateString(selectedTimestamp1);
        const date2 = parseDateString(selectedTimestamp2);
        
        console.log('Date 1:', date1.toISOString());
        console.log('Date 2:', date2.toISOString());
        
        const endDate1 = new Date(date1);
        endDate1.setHours(date1.getHours() + 1);
        
        const endDate2 = new Date(date2);
        endDate2.setHours(date2.getHours() + 1);

        const { data: data1, error: error1 } = await supabase
          .from('emotiondata')
          .select('emotion, percentage')
          .eq('namecourses', selectedCourseForComparison.namecourses)
          .gte('timestamp', date1.toISOString())
          .lt('timestamp', endDate1.toISOString());

        const { data: data2, error: error2 } = await supabase
          .from('emotiondata')
          .select('emotion, percentage')
          .eq('namecourses', selectedCourseForComparison.namecourses)
          .gte('timestamp', date2.toISOString())
          .lt('timestamp', endDate2.toISOString());

        console.log('Raw Data 1:', data1);
        console.log('Raw Data 2:', data2);

        if (error1 || error2) {
          console.error('Error fetching comparison data:', error1 || error2);
          return;
        }

        if (!data1 || !data2 || data1.length === 0 || data2.length === 0) {
          console.log('No emotion data found for the selected time periods.');
          setComparisonData1([]);
          setComparisonData2([]);
          setIsModalOpen(true);
          return;
        }

        setComparisonData1(data1);
        setComparisonData2(data2);
        setIsModalOpen(true);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      }
    }
  };

  useEffect(() => {
    const teacherName = userName || localStorage.getItem('userName');
    if (teacherName) {
      fetchUserCourses(teacherName);
    }
  }, [userName]);

  useEffect(() => {
    const storedCourse = localStorage.getItem("selectedCourse");
    const storedUserName = localStorage.getItem("userName");

    if (storedCourse) {
      const parsedCourse = JSON.parse(storedCourse);
      setSelectedCourse(parsedCourse);
      setSelectedCourseForComparison(parsedCourse);
    } else {
      router.push("/teacher_dashboard");
    }

    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      router.push("/teacher_dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (selectedCourseForComparison) {
      fetchTimestamps(selectedCourseForComparison.courses_id);
      setSelectedTimestamp1(null);
      setSelectedTimestamp2(null);
    }
  }, [selectedCourseForComparison]);

  const handleTimestampSelect = (timestamp, selectionNumber) => {
    if (selectionNumber === 1) {
      setSelectedTimestamp1(timestamp);
    } else {
      setSelectedTimestamp2(timestamp);
    }
  };

  if (!selectedCourse) {
    return <p className="text-center mt-10 text-xl">กำลังโหลดข้อมูล...</p>;
  }

  const chartData = Object.keys({ ...formatData(comparisonData1), ...formatData(comparisonData2) }).map((emotion) => ({
    emotion,
    'ช่วงเวลาที่ 1': formatData(comparisonData1)[emotion] || 0,
    'ช่วงเวลาที่ 2': formatData(comparisonData2)[emotion] || 0,
  }));

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-sky-200 text-black p-4 relative">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-[#305065] mb-6" />

        <div className="mt-4 flex flex-col items-start space-y-2">
          <button
            onClick={() => router.push("/analyze_face")}
            className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md transition duration-300"
          >
            วิเคราะห์ใบหน้า
          </button>
          <button
            onClick={() => router.push("/result")}
            className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md transition duration-300"
          >
            ผลวิเคราะห์
          </button>
          <button
            onClick={() => router.push("/compare_result")}
            className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md transition duration-300"
          >
            เปรียบเทียบผลวิเคราะห์
          </button>
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-600 hover:bg-gray-400 px-4 py-2 rounded-md text-white mt-4"
          >
            ย้อนกลับ
          </button>
        </div>

        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-pink-400 active:bg-[#1d2f3f] text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          ตอนนี้อยู่ในวิชา {selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})
        </h2>
        <p className="text-lg mb-6">ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}</p>

        {isResultPage && (
          <div className="flex flex-col space-y-8">
            <h3 className="text-xl">
              <span className="bg-pink-200 px-2 py-1 rounded">
                ตอนนี้อยู่ในหน้าผลเปรียบเทียบผลวิเคราะห์
              </span>
            </h3>

            <div className="w-full max-w-md">
              <h4 className="text-lg font-semibold mb-2">เลือกวิชาที่ต้องการเปรียบเทียบ:</h4>
              <select
                value={selectedCourseForComparison?.courses_id || ''}
                onChange={(e) => {
                  const course = courses.find(c => c.courses_id === e.target.value);
                  setSelectedCourseForComparison(course);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {courses.map((course) => (
                  <option key={course.courses_id} value={course.courses_id}>
                    {course.namecourses} (รหัส: {course.courses_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">เลือกช่วงเวลาที่ 1:</h4>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <ul className="divide-y divide-gray-200">
                    {timestamps.map((timestamp, index) => (
                      <li 
                        key={`timestamp1-${index}`}
                        onClick={() => handleTimestampSelect(timestamp, 1)}
                        className={`py-3 px-4 cursor-pointer transition-all duration-300 ${
                          selectedTimestamp1 === timestamp
                            ? 'bg-sky-100'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="timestamp1"
                            checked={selectedTimestamp1 === timestamp}
                            onChange={() => handleTimestampSelect(timestamp, 1)}
                            className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                          />
                          <label className="ml-3 block text-sm font-medium text-gray-700">
                            {timestamp}
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">เลือกช่วงเวลาที่ 2:</h4>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <ul className="divide-y divide-gray-200">
                    {timestamps.map((timestamp, index) => (
                      <li
                        key={`timestamp2-${index}`}
                        onClick={() => handleTimestampSelect(timestamp, 2)}
                        className={`py-3 px-4 cursor-pointer transition-all duration-300 ${
                          selectedTimestamp2 === timestamp
                            ? 'bg-sky-100'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="timestamp2"
                            checked={selectedTimestamp2 === timestamp}
                            onChange={() => handleTimestampSelect(timestamp, 2)}
                            className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                          />
                          <label className="ml-3 block text-sm font-medium text-gray-700">
                            {timestamp}
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleCompare}
                disabled={!selectedTimestamp1 || !selectedTimestamp2}
                className={`px-6 py-3 rounded-lg shadow-md transition-all duration-300 ${
                  selectedTimestamp1 && selectedTimestamp2
                    ? 'bg-sky-600 hover:bg-sky-500 text-white'
                    : 'bg-gray-300 cursor-not-allowed text-gray-500'
                }`}
              >
                เปรียบเทียบผล
              </button>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-7xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">เปรียบเทียบอารมณ์ระหว่างช่วงเวลา</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">ช่วงเวลาที่ 1: {selectedTimestamp1}</p>
                <p className="text-sm text-gray-600">ช่วงเวลาที่ 2: {selectedTimestamp2}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Column Chart */}
                <div className="h-96">
                  <h3 className="text-center font-semibold mb-2">Column Chart Comparison</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                      <YAxis type="category" dataKey="emotion" />
                      <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
                      <Legend />
                      <Bar dataKey="ช่วงเวลาที่ 1" fill="#8884d8" />
                      <Bar dataKey="ช่วงเวลาที่ 2" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

          

                
                {/* Data Summary Table */}
                <div className="h-96 overflow-auto">
                  <h3 className="text-center font-semibold mb-2">Data Summary Table</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emotion</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Period 1</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Period 2</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {chartData.map((row) => (
                        <tr key={row.emotion}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.emotion}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(row['ช่วงเวลาที่ 1'] * 100).toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(row['ช่วงเวลาที่ 2'] * 100).toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{((row['ช่วงเวลาที่ 2'] - row['ช่วงเวลาที่ 1']) * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareResultPage;