'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CompareCourses() {
  const [userName, setUserName] = useState('');
  const [courses, setCourses] = useState([]);
  const [course1, setCourse1] = useState('');
  const [course2, setCourse2] = useState('');
  const [course1Data, setCourse1Data] = useState(null);
  const [course2Data, setCourse2Data] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Comparison Type State
  const [comparisonType, setComparisonType] = useState("daily"); // "daily", "monthly", or "yearly"
  
  // Daily Comparison States
  const [course1Times, setCourse1Times] = useState([]);
  const [course2Times, setCourse2Times] = useState([]);
  const [selectedTime1, setSelectedTime1] = useState('');
  const [selectedTime2, setSelectedTime2] = useState('');
  
  // Monthly Comparison States
  const [course1Months, setCourse1Months] = useState([]);
  const [course2Months, setCourse2Months] = useState([]);
  const [selectedMonth1, setSelectedMonth1] = useState('');
  const [selectedMonth2, setSelectedMonth2] = useState('');
  
  // Yearly Comparison States
  const [course1Years, setCourse1Years] = useState([]);
  const [course2Years, setCourse2Years] = useState([]);
  const [selectedYear1, setSelectedYear1] = useState('');
  const [selectedYear2, setSelectedYear2] = useState('');

  useEffect(() => {
    // Load user data on component mount
    const loadUserData = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          if (user.role === 'teacher') {
            console.log('Teacher logged in:', user.name);
            setUserName(user.name);
            fetchCourses(user.user_id);
          } else {
            console.log('Invalid role, redirecting to login');
            router.push('/login');
          }
        } else {
          console.log('No user found, redirecting to login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/login');
      }
    };

    loadUserData();
  }, [router]);

  const fetchCourses = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('courses_id, namecourses, term, year, user_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching courses:', error);
        setError('ไม่สามารถดึงข้อมูลรายวิชาได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }
      
      console.log('Courses fetched successfully:', data);
      setCourses(data);
    } catch (error) {
      console.error('Exception when fetching courses:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Function to toggle comparison type
  const toggleComparisonType = (type) => {
    setComparisonType(type);
    resetSelections();
    
    if (course1) {
      if (type === "daily") {
        fetchCourseTimes(course1, setCourse1Times);
      } else if (type === "monthly") {
        fetchCourseMonths(course1, setCourse1Months);
      } else if (type === "yearly") {
        fetchCourseYears(course1, setCourse1Years);
      }
    }
    
    if (course2) {
      if (type === "daily") {
        fetchCourseTimes(course2, setCourse2Times);
      } else if (type === "monthly") {
        fetchCourseMonths(course2, setCourse2Months);
      } else if (type === "yearly") {
        fetchCourseYears(course2, setCourse2Years);
      }
    }
  };

  const resetSelections = () => {
    // Reset all time-related selections
    setSelectedTime1('');
    setSelectedTime2('');
    setSelectedMonth1('');
    setSelectedMonth2('');
    setSelectedYear1('');
    setSelectedYear2('');
    
    // Reset data
    setCourse1Data(null);
    setCourse2Data(null);
    setComparisonData(null);
    setError(null);
  };

  // DAILY COMPARISON FUNCTIONS
  const fetchCourseTimes = async (courseId, setCourseTimesFunction) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // แปลง courseId เป็น integer เนื่องจาก courses_id เป็นประเภท int4 ในฐานข้อมูล
      const courseIdInt = parseInt(courseId, 10);
      
      if (isNaN(courseIdInt)) {
        console.error('Invalid courseId (not a number):', courseId);
        setError(`รหัสวิชาไม่ถูกต้อง: ${courseId}`);
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching times for course ID: ${courseIdInt}`);
      
      // ดึงข้อมูลเวลาทั้งหมด
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('detection_time')
        .eq('courses_id', courseIdInt)
        .order('detection_time', { ascending: false });

      if (error) {
        console.error(`Error fetching times for course ${courseIdInt}:`, error);
        setError(`ไม่สามารถดึงข้อมูลเวลาสำหรับรายวิชา ${courseId} ได้`);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log(`No time data found for course ${courseIdInt}`);
        setCourseTimesFunction([]);
        setIsLoading(false);
        return;
      }

      // จัดกลุ่มวันที่โดยตัดเวลาออกและเก็บเฉพาะวันที่
      const dateMap = {};
      
      data.forEach(item => {
        const fullDate = new Date(item.detection_time);
        // สร้างสตริงวันที่ในรูปแบบ ISO แต่เฉพาะส่วนวัน เดือน ปี เท่านั้น
        const dateOnly = `${fullDate.getFullYear()}-${(fullDate.getMonth() + 1).toString().padStart(2, '0')}-${fullDate.getDate().toString().padStart(2, '0')}`;
        
        // ใช้วันที่เป็น key เพื่อกรองวันที่ซ้ำ
        dateMap[dateOnly] = true;
      });
      
      // แปลงกลับเป็น array ของวันที่ที่ไม่ซ้ำกัน และเรียงจากล่าสุดไปเก่าสุด
      const uniqueDates = Object.keys(dateMap).sort().reverse();
      
      console.log(`Found ${uniqueDates.length} unique dates for course ${courseIdInt}`);
      setCourseTimesFunction(uniqueDates);
      setIsLoading(false);
    } catch (error) {
      console.error(`Exception when fetching times for course ${courseId}:`, error);
      setError(`เกิดข้อผิดพลาดขณะดึงข้อมูลเวลา: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const fetchCourseEmotionData = async (courseId, dateTime, setCourseDataFunction) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!courseId || !dateTime) {
        console.error('Missing required parameters:', { courseId, dateTime });
        setError('กรุณาเลือกรายวิชาและวันที่ให้ครบถ้วน');
        setIsLoading(false);
        return;
      }
      
      // แปลง courseId เป็น integer
      const courseIdInt = parseInt(courseId, 10);
      
      if (isNaN(courseIdInt)) {
        console.error('Invalid courseId (not a number):', courseId);
        setError(`รหัสวิชาไม่ถูกต้อง: ${courseId}`);
        setIsLoading(false);
        return;
      }
      
      // แปลงเป็นวัตถุ Date
      const selectedDate = new Date(dateTime);
      console.log("Selected date (input):", dateTime);
      
      // สร้างรูปแบบสำหรับการค้นหา
      const targetDateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
      console.log(`Filtering for date: ${targetDateStr}`);
      
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('*')
        .eq('courses_id', courseIdInt);
        
      if (error) {
        console.error(`Error fetching ALL emotion data for course ${courseIdInt}:`, error);
        setError(`ไม่สามารถดึงข้อมูลอารมณ์สำหรับรายวิชา ${courseId} ได้: ${error.message || JSON.stringify(error)}`);
        setIsLoading(false);
        return;
      }
      
      // ตรวจสอบว่ามีข้อมูลไหม
      if (!data || data.length === 0) {
        console.log(`No data found for course ${courseIdInt}`);
        setError(`ไม่พบข้อมูลอารมณ์สำหรับรายวิชา ${courseId} ในระบบ`);
        setIsLoading(false);
        return;
      }
      
      // กรองข้อมูลตามวันที่เอง
      const filteredData = data.filter(item => {
        const itemDate = new Date(item.detection_time);
        const itemDateStr = `${itemDate.getFullYear()}-${(itemDate.getMonth() + 1).toString().padStart(2, '0')}-${itemDate.getDate().toString().padStart(2, '0')}`;
        return itemDateStr === targetDateStr;
      });
      
      console.log(`After manual filtering, found ${filteredData.length} records`);
      
      if (filteredData.length === 0) {
        setError(`ไม่พบข้อมูลอารมณ์สำหรับวันที่ ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()} ในรายวิชา ${courseId}`);
        setIsLoading(false);
        return;
      }

      // จัดกลุ่มอารมณ์ในรูปแบบที่ถูกต้อง
      const emotionCounts = {
        happy: 0,
        sad: 0,
        angry: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        neutral: 0
      };

      filteredData.forEach(record => {
        const emotion = record.emotion ? record.emotion.toLowerCase() : '';
        
        if (emotion === 'happiness') emotionCounts.happy++;
        else if (emotion === 'sadness') emotionCounts.sad++;
        else if (emotion === 'anger') emotionCounts.angry++;
        else if (emotion === 'fear') emotionCounts.fear++;
        else if (emotion === 'surprise') emotionCounts.surprise++;
        else if (emotion === 'disgust') emotionCounts.disgust++;
        else if (emotion === 'neutral') emotionCounts.neutral++;
        else if (emotion === 'happy') emotionCounts.happy++;
        else if (emotion === 'sad') emotionCounts.sad++;
      });

      // Get course details from courses array
      const courseDetails = courses.find(course => parseInt(course.courses_id, 10) === courseIdInt);
      
      console.log(`Successfully processed emotion data:`, emotionCounts);
      setCourseDataFunction({
        ...emotionCounts,
        courseName: courseDetails ? courseDetails.namecourses : `วิชา ${courseId}`,
        courseId: courseId,
        selectedDate: selectedDate.toISOString(),
        selectedType: 'day',
        totalDetections: filteredData.length
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error(`Exception when fetching emotion data for course ${courseId}:`, error);
      setError(`เกิดข้อผิดพลาดขณะดึงข้อมูลอารมณ์: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // MONTHLY COMPARISON FUNCTIONS
  const fetchCourseMonths = async (courseId, setCourseMonthsFunction) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const courseIdInt = parseInt(courseId, 10);
      
      if (isNaN(courseIdInt)) {
        setError(`รหัสวิชาไม่ถูกต้อง: ${courseId}`);
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching months for course ID: ${courseIdInt}`);
      
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('detection_time')
        .eq('courses_id', courseIdInt);

      if (error) {
        console.error(`Error fetching months for course ${courseIdInt}:`, error);
        setError(`ไม่สามารถดึงข้อมูลเดือนสำหรับรายวิชา ${courseId} ได้`);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log(`No month data found for course ${courseIdInt}`);
        setCourseMonthsFunction([]);
        setIsLoading(false);
        return;
      }

      // Extract year-month format (YYYY-MM) from timestamps
      const monthsMap = {};
      
      data.forEach(item => {
        const date = new Date(item.detection_time);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthsMap[yearMonth] = true;
      });
      
      // Convert to array and sort
      const uniqueMonths = Object.keys(monthsMap).sort().reverse();
      
      console.log(`Found ${uniqueMonths.length} unique months for course ${courseIdInt}`);
      setCourseMonthsFunction(uniqueMonths);
      setIsLoading(false);
    } catch (error) {
      console.error(`Exception when fetching months for course ${courseId}:`, error);
      setError(`เกิดข้อผิดพลาดขณะดึงข้อมูลเดือน: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const fetchCourseEmotionDataByMonth = async (courseId, yearMonth, setCourseDataFunction) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!courseId || !yearMonth) {
        setError('กรุณาเลือกรายวิชาและเดือนให้ครบถ้วน');
        setIsLoading(false);
        return;
      }
      
      const courseIdInt = parseInt(courseId, 10);
      
      if (isNaN(courseIdInt)) {
        setError(`รหัสวิชาไม่ถูกต้อง: ${courseId}`);
        setIsLoading(false);
        return;
      }
      
      // Split year and month
      const [year, month] = yearMonth.split('-');
      const nextMonth = month === '12' 
        ? `${parseInt(year) + 1}-01` 
        : `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}`;
      
      console.log(`Fetching data for ${yearMonth} to ${nextMonth}`);
      
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('*')
        .eq('courses_id', courseIdInt)
        .gte('detection_time', `${yearMonth}-01T00:00:00`)
        .lt('detection_time', `${nextMonth}-01T00:00:00`);
        
      if (error) {
        console.error(`Error fetching emotion data by month for course ${courseIdInt}:`, error);
        setError(`ไม่สามารถดึงข้อมูลอารมณ์สำหรับรายวิชา ${courseId} ได้: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        setError(`ไม่พบข้อมูลอารมณ์สำหรับเดือน ${formatThaiMonth(yearMonth)} ในรายวิชา ${courseId}`);
        setIsLoading(false);
        return;
      }

      // Group emotions
      const emotionCounts = {
        happy: 0,
        sad: 0,
        angry: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        neutral: 0
      };

      data.forEach(record => {
        const emotion = record.emotion ? record.emotion.toLowerCase() : '';
        
        if (emotion === 'happiness') emotionCounts.happy++;
        else if (emotion === 'sadness') emotionCounts.sad++;
        else if (emotion === 'anger') emotionCounts.angry++;
        else if (emotion === 'fear') emotionCounts.fear++;
        else if (emotion === 'surprise') emotionCounts.surprise++;
        else if (emotion === 'disgust') emotionCounts.disgust++;
        else if (emotion === 'neutral') emotionCounts.neutral++;
        else if (emotion === 'happy') emotionCounts.happy++;
        else if (emotion === 'sad') emotionCounts.sad++;
      });

      // Get course details
      const courseDetails = courses.find(course => parseInt(course.courses_id, 10) === courseIdInt);
      
      setCourseDataFunction({
        ...emotionCounts,
        courseName: courseDetails ? courseDetails.namecourses : `วิชา ${courseId}`,
        courseId: courseId,
        selectedDate: yearMonth,
        selectedType: 'month',
        totalDetections: data.length
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error(`Exception when fetching emotion data by month for course ${courseId}:`, error);
      setError(`เกิดข้อผิดพลาดขณะดึงข้อมูลอารมณ์: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // YEARLY COMPARISON FUNCTIONS
  const fetchCourseYears = async (courseId, setCourseYearsFunction) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const courseIdInt = parseInt(courseId, 10);
      
      if (isNaN(courseIdInt)) {
        setError(`รหัสวิชาไม่ถูกต้อง: ${courseId}`);
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching years for course ID: ${courseIdInt}`);
      
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('detection_time')
        .eq('courses_id', courseIdInt);

      if (error) {
        console.error(`Error fetching years for course ${courseIdInt}:`, error);
        setError(`ไม่สามารถดึงข้อมูลปีสำหรับรายวิชา ${courseId} ได้`);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log(`No year data found for course ${courseIdInt}`);
        setCourseYearsFunction([]);
        setIsLoading(false);
        return;
      }

      // Extract year format (YYYY) from timestamps
      const yearsMap = {};
      
      data.forEach(item => {
        const date = new Date(item.detection_time);
        const year = `${date.getFullYear()}`;
        yearsMap[year] = true;
      });
      
      // Convert to array and sort
      const uniqueYears = Object.keys(yearsMap).sort().reverse();
      
      console.log(`Found ${uniqueYears.length} unique years for course ${courseIdInt}`);
      setCourseYearsFunction(uniqueYears);
      setIsLoading(false);
    } catch (error) {
      console.error(`Exception when fetching years for course ${courseId}:`, error);
      setError(`เกิดข้อผิดพลาดขณะดึงข้อมูลปี: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const fetchCourseEmotionDataByYear = async (courseId, year, setCourseDataFunction) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!courseId || !year) {
        setError('กรุณาเลือกรายวิชาและปีให้ครบถ้วน');
        setIsLoading(false);
        return;
      }
      
      const courseIdInt = parseInt(courseId, 10);
      
      if (isNaN(courseIdInt)) {
        setError(`รหัสวิชาไม่ถูกต้อง: ${courseId}`);
        setIsLoading(false);
        return;
      }
      
      const nextYear = `${parseInt(year) + 1}`;
      
      console.log(`Fetching data for year ${year} to ${nextYear}`);
      
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('*')
        .eq('courses_id', courseIdInt)
        .gte('detection_time', `${year}-01-01T00:00:00`)
        .lt('detection_time', `${nextYear}-01-01T00:00:00`);
        
      if (error) {
        console.error(`Error fetching emotion data by year for course ${courseIdInt}:`, error);
        setError(`ไม่สามารถดึงข้อมูลอารมณ์สำหรับรายวิชา ${courseId} ได้: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        setError(`ไม่พบข้อมูลอารมณ์สำหรับปี ${formatThaiYear(year)} ในรายวิชา ${courseId}`);
        setIsLoading(false);
        return;
      }

      // Group emotions
      const emotionCounts = {
        happy: 0,
        sad: 0,
        angry: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        neutral: 0
      };

      data.forEach(record => {
        const emotion = record.emotion ? record.emotion.toLowerCase() : '';
        
        if (emotion === 'happiness') emotionCounts.happy++;
        else if (emotion === 'sadness') emotionCounts.sad++;
        else if (emotion === 'anger') emotionCounts.angry++;
        else if (emotion === 'fear') emotionCounts.fear++;
        else if (emotion === 'surprise') emotionCounts.surprise++;
        else if (emotion === 'disgust') emotionCounts.disgust++;
        else if (emotion === 'neutral') emotionCounts.neutral++;
        else if (emotion === 'happy') emotionCounts.happy++;
        else if (emotion === 'sad') emotionCounts.sad++;
      });

      // Get course details
      const courseDetails = courses.find(course => parseInt(course.courses_id, 10) === courseIdInt);
      
      setCourseDataFunction({
        ...emotionCounts,
        courseName: courseDetails ? courseDetails.namecourses : `วิชา ${courseId}`,
        courseId: courseId,
        selectedDate: year,
        selectedType: 'year',
        totalDetections: data.length
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error(`Exception when fetching emotion data by year for course ${courseId}:`, error);
      setError(`เกิดข้อผิดพลาดขณะดึงข้อมูลอารมณ์: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Helper functions to format dates in Thai
  const formatDateTime = (isoString) => {
    try {
      const date = new Date(isoString);
      // แสดงเฉพาะวันที่ในรูปแบบไทย ไม่แสดงเวลา
      return date.toLocaleDateString('th-TH');
    } catch (error) {
      console.error('Error formatting date:', error);
      return isoString || '';
    }
  };

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

  const formatThaiYear = (year) => {
    if (!year) return "";
    return `พ.ศ. ${parseInt(year) + 543}`;
  };

  // Event handlers for all selection types
  const handleCourse1Change = (e) => {
    const courseId = e.target.value;
    
    // เพิ่มเงื่อนไขป้องกันเลือกวิชาซ้ำ
    if (courseId && courseId === course2) {
      alert('กรุณาเลือกวิชาที่แตกต่างกัน');
      return;
    }
  
    setCourse1(courseId);
    resetSelections();
    
    if (courseId) {
      if (comparisonType === "daily") {
        fetchCourseTimes(courseId, setCourse1Times);
      } else if (comparisonType === "monthly") {
        fetchCourseMonths(courseId, setCourse1Months);
      } else if (comparisonType === "yearly") {
        fetchCourseYears(courseId, setCourse1Years);
      }
    } else {
      setCourse1Times([]);
      setCourse1Months([]);
      setCourse1Years([]);
    }
  };
  
  const handleCourse2Change = (e) => {
    const courseId = e.target.value;
    
    // เพิ่มเงื่อนไขป้องกันเลือกวิชาซ้ำ
    if (courseId && courseId === course1) {
      alert('กรุณาเลือกวิชาที่แตกต่างกัน');
      return;
    }
  
    setCourse2(courseId);
    resetSelections();
    
    if (courseId) {
      if (comparisonType === "daily") {
        fetchCourseTimes(courseId, setCourse2Times);
      } else if (comparisonType === "monthly") {
        fetchCourseMonths(courseId, setCourse2Months);
      } else if (comparisonType === "yearly") {
        fetchCourseYears(courseId, setCourse2Years);
      }
    } else {
      setCourse2Times([]);
      setCourse2Months([]);
      setCourse2Years([]);
    }
  };

  const handleTime1Change = (e) => {
    const time = e.target.value;
    setSelectedTime1(time);
    setComparisonData(null);
    setError(null);
    
    if (time) {
      fetchCourseEmotionData(course1, time, setCourse1Data);
    } else {
      setCourse1Data(null);
    }
  };

  const handleTime2Change = (e) => {
    const time = e.target.value;
    setSelectedTime2(time);
    setComparisonData(null);
    setError(null);
    
    if (time) {
      fetchCourseEmotionData(course2, time, setCourse2Data);
    } else {
      setCourse2Data(null);
    }
  };

  const handleMonth1Change = (e) => {
    const month = e.target.value;
    setSelectedMonth1(month);
    setComparisonData(null);
    setError(null);
    
    if (month) {
      fetchCourseEmotionDataByMonth(course1, month, setCourse1Data);
    } else {
      setCourse1Data(null);
    }
  };

  const handleMonth2Change = (e) => {
    const month = e.target.value;
    setSelectedMonth2(month);
    setComparisonData(null);
    setError(null);
    
    if (month) {
      fetchCourseEmotionDataByMonth(course2, month, setCourse2Data);
    } else {
      setCourse2Data(null);
    }
  };

  const handleYear1Change = (e) => {
    const year = e.target.value;
    setSelectedYear1(year);
    setComparisonData(null);
    setError(null);
    
    if (year) {
      fetchCourseEmotionDataByYear(course1, year, setCourse1Data);
    } else {
      setCourse1Data(null);
    }
  };

  const handleYear2Change = (e) => {
    const year = e.target.value;
    setSelectedYear2(year);
    setComparisonData(null);
    setError(null);
    
    if (year) {
      fetchCourseEmotionDataByYear(course2, year, setCourse2Data);
    } else {
      setCourse2Data(null);
    }
  };

  const prepareComparisonData = () => {
    if (!course1Data || !course2Data) return null;

    const emotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'];
    
    return emotions.map(emotion => {
      // Calculate percentages for more accurate comparison
      const course1Percent = course1Data.totalDetections > 0 
        ? (course1Data[emotion] / course1Data.totalDetections) * 100 
        : 0;
      
      const course2Percent = course2Data.totalDetections > 0 
        ? (course2Data[emotion] / course2Data.totalDetections) * 100 
        : 0;
        
      return {
        name: formatEmotionName(emotion),
        [`${course1Data.courseName} (%)`]: parseFloat(course1Percent.toFixed(1)),
        [`${course2Data.courseName} (%)`]: parseFloat(course2Percent.toFixed(1)),
        [`${course1Data.courseName} (จำนวน)`]: course1Data[emotion],
        [`${course2Data.courseName} (จำนวน)`]: course2Data[emotion]
      };
    });
  };

  const formatEmotionName = (emotion) => {
    const emotionMap = {
      'happy': 'ความสุข',
      'sad': 'ความเศร้า',
      'angry': 'ความโกรธ',
      'fear': 'ความกลัว',
      'surprise': 'ความประหลาดใจ',
      'disgust': 'ความรังเกียจ',
      'neutral': 'เป็นกลาง'
    };
    
    return emotionMap[emotion] || emotion;
  };

  const handleCompare = () => {
    if (course1Data && course2Data) {
      setComparisonData(prepareComparisonData());
    }
  };

  const handleBackClick = () => {
    router.push('/Teacher_dashboard');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black p-4 relative">
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
          <button
            onClick={handleBackClick}
            className="w-full bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-md text-white mt-4"
          >
            ย้อนกลับ
          </button>
        </div>

        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={() => {
              localStorage.removeItem('selectedCourse');
              localStorage.removeItem('user');
              router.push('/login');
            }}
            className="w-full block py-2.5 px-4 bg-red-400 active:bg-[#1d2f3f] focus:outline-none text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">เปรียบเทียบผลวิเคราะห์ระหว่างรายวิชา</h2>
        
        {/* Comparison Type Selection */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => toggleComparisonType("daily")}
            className={`py-2 px-4 rounded-lg text-center ${
              comparisonType === "daily" 
                ? "bg-sky-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            เปรียบเทียบรายวัน
          </button>
          <button
            onClick={() => toggleComparisonType("monthly")}
            className={`py-2 px-4 rounded-lg text-center ${
              comparisonType === "monthly" 
                ? "bg-sky-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            เปรียบเทียบรายเดือน
          </button>
          <button
            onClick={() => toggleComparisonType("yearly")}
            className={`py-2 px-4 rounded-lg text-center ${
              comparisonType === "yearly" 
                ? "bg-sky-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            เปรียบเทียบรายปี
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">เกิดข้อผิดพลาด</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Course 1 Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">วิชาที่ 1</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลือกวิชา
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={course1}
                onChange={handleCourse1Change}
                disabled={isLoading}
              >
                <option value="">-- เลือกวิชา --</option>
                {courses
                  .filter((course) => course.courses_id.toString() !== course2)
                  .map((course) => (
                    <option key={`c1-${course.courses_id}`} value={course.courses_id}>
                      {course.courses_id} - {course.namecourses}
                    </option>
                  ))
                }
              </select>
            </div>
            
            {/* Daily selection */}
            {comparisonType === "daily" && course1 && course1Times.length === 0 && !isLoading && (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                ไม่พบข้อมูลวันที่สำหรับรายวิชานี้
              </div>
            )}
            
            {comparisonType === "daily" && course1Times.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกวัน
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={selectedTime1}
                  onChange={handleTime1Change}
                  disabled={isLoading}
                >
                  <option value="">-- เลือกวัน --</option>
                  {course1Times.map((time, index) => (
                    <option key={`t1-${index}`} value={time}>
                      {formatDateTime(time)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Monthly selection */}
            {comparisonType === "monthly" && course1 && course1Months.length === 0 && !isLoading && (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                ไม่พบข้อมูลเดือนสำหรับรายวิชานี้
              </div>
            )}
            
            {comparisonType === "monthly" && course1Months.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกเดือน
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={selectedMonth1}
                  onChange={handleMonth1Change}
                  disabled={isLoading}
                >
                  <option value="">-- เลือกเดือน --</option>
                  {course1Months.map((month, index) => (
                    <option key={`m1-${index}`} value={month}>
                      {formatThaiMonth(month)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Yearly selection */}
            {comparisonType === "yearly" && course1 && course1Years.length === 0 && !isLoading && (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                ไม่พบข้อมูลปีสำหรับรายวิชานี้
              </div>
            )}
            
            {comparisonType === "yearly" && course1Years.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกปี
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={selectedYear1}
                  onChange={handleYear1Change}
                  disabled={isLoading}
                >
                  <option value="">-- เลือกปี --</option>
                  {course1Years.map((year, index) => (
                    <option key={`y1-${index}`} value={year}>
                      {formatThaiYear(year)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {course1Data && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-lg mb-2">ข้อมูลที่เลือก</h4>
                <p>วิชา: {course1Data.courseName} ({course1Data.courseId})</p>
                <p>
                  {course1Data.selectedType === 'month' ? 'เดือน: ' :
                  course1Data.selectedType === 'year' ? 'ปี: ' : 'วันที่: '}
                  {course1Data.selectedType === 'month' ? formatThaiMonth(course1Data.selectedDate) :
                  course1Data.selectedType === 'year' ? formatThaiYear(course1Data.selectedDate) :
                  formatDateTime(course1Data.selectedDate)}
                </p>
                <p>จำนวนการตรวจจับทั้งหมด: {course1Data.totalDetections}</p>
              </div>
            )}
          </div>
          
          {/* Course 2 Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">วิชาที่ 2</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลือกวิชา
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={course2}
                onChange={handleCourse2Change}
                disabled={isLoading}
              >
                <option value="">-- เลือกวิชา --</option>
                {courses
                  .filter((course) => course.courses_id.toString() !== course1)
                  .map((course) => (
                    <option key={`c2-${course.courses_id}`} value={course.courses_id}>
                      {course.courses_id} - {course.namecourses}
                    </option>
                  ))
                }
              </select>
            </div>
            
            {/* Daily selection */}
            {comparisonType === "daily" && course2 && course2Times.length === 0 && !isLoading && (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                ไม่พบข้อมูลวันที่สำหรับรายวิชานี้
              </div>
            )}
            
            {comparisonType === "daily" && course2Times.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกวัน
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={selectedTime2}
                  onChange={handleTime2Change}
                  disabled={isLoading}
                >
                  <option value="">-- เลือกวัน --</option>
                  {course2Times.map((time, index) => (
                    <option key={`t2-${index}`} value={time}>
                      {formatDateTime(time)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Monthly selection */}
            {comparisonType === "monthly" && course2 && course2Months.length === 0 && !isLoading && (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                ไม่พบข้อมูลเดือนสำหรับรายวิชานี้
              </div>
            )}
            
            {comparisonType === "monthly" && course2Months.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกเดือน
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={selectedMonth2}
                  onChange={handleMonth2Change}
                  disabled={isLoading}
                >
                  <option value="">-- เลือกเดือน --</option>
                  {course2Months.map((month, index) => (
                    <option key={`m2-${index}`} value={month}>
                      {formatThaiMonth(month)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Yearly selection */}
            {comparisonType === "yearly" && course2 && course2Years.length === 0 && !isLoading && (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                ไม่พบข้อมูลปีสำหรับรายวิชานี้
              </div>
            )}
            
            {comparisonType === "yearly" && course2Years.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกปี
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={selectedYear2}
                  onChange={handleYear2Change}
                  disabled={isLoading}
                >
                  <option value="">-- เลือกปี --</option>
                  {course2Years.map((year, index) => (
                    <option key={`y2-${index}`} value={year}>
                      {formatThaiYear(year)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {course2Data && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-lg mb-2">ข้อมูลที่เลือก</h4>
                <p>วิชา: {course2Data.courseName} ({course2Data.courseId})</p>
                <p>
                  {course2Data.selectedType === 'month' ? 'เดือน: ' :
                  course2Data.selectedType === 'year' ? 'ปี: ' : 'วันที่: '}
                  {course2Data.selectedType === 'month' ? formatThaiMonth(course2Data.selectedDate) :
                  course2Data.selectedType === 'year' ? formatThaiYear(course2Data.selectedDate) :
                  formatDateTime(course2Data.selectedDate)}
                </p>
                <p>จำนวนการตรวจจับทั้งหมด: {course2Data.totalDetections}</p>
              </div>
            )}
          </div>
        </div>
        
        {isLoading && (
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>กำลังประมวลผล...</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mb-8">
          <button
            onClick={handleCompare}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition duration-300"
            disabled={!course1Data || !course2Data || isLoading}
          >
            เปรียบเทียบข้อมูล
          </button>
        </div>
        
        {/* Comparison Results */}
        {comparisonData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">ผลการเปรียบเทียบอารมณ์</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={`${course1Data.courseName} (%)`} fill="#8884d8" />
                  <Bar dataKey={`${course2Data.courseName} (%)`} fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-lg mb-2">
                  {course1Data.courseName} ({course1Data.courseId})
                </h4>
                <p>
                  {course1Data.selectedType === 'month' ? 'เดือน: ' :
                  course1Data.selectedType === 'year' ? 'ปี: ' : 'วันที่: '}
                  {course1Data.selectedType === 'month' ? formatThaiMonth(course1Data.selectedDate) :
                  course1Data.selectedType === 'year' ? formatThaiYear(course1Data.selectedDate) :
                  formatDateTime(course1Data.selectedDate)}
                </p>
                <p>จำนวนการตรวจจับทั้งหมด: {course1Data.totalDetections}</p>
                <div className="mt-2">
                  <p>ความสุข: {course1Data.happy} ({((course1Data.happy / course1Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความเศร้า: {course1Data.sad} ({((course1Data.sad / course1Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความโกรธ: {course1Data.angry} ({((course1Data.angry / course1Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความกลัว: {course1Data.fear} ({((course1Data.fear / course1Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความประหลาดใจ: {course1Data.surprise} ({((course1Data.surprise / course1Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความรังเกียจ: {course1Data.disgust} ({((course1Data.disgust / course1Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>เป็นกลาง: {course1Data.neutral} ({((course1Data.neutral / course1Data.totalDetections) * 100).toFixed(1)}%)</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-lg mb-2">
                  {course2Data.courseName} ({course2Data.courseId})
                </h4>
                <p>
                  {course2Data.selectedType === 'month' ? 'เดือน: ' :
                  course2Data.selectedType === 'year' ? 'ปี: ' : 'วันที่: '}
                  {course2Data.selectedType === 'month' ? formatThaiMonth(course2Data.selectedDate) :
                  course2Data.selectedType === 'year' ? formatThaiYear(course2Data.selectedDate) :
                  formatDateTime(course2Data.selectedDate)}
                </p>
                <p>จำนวนการตรวจจับทั้งหมด: {course2Data.totalDetections}</p>
                <div className="mt-2">
                  <p>ความสุข: {course2Data.happy} ({((course2Data.happy / course2Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความเศร้า: {course2Data.sad} ({((course2Data.sad / course2Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความโกรธ: {course2Data.angry} ({((course2Data.angry / course2Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความกลัว: {course2Data.fear} ({((course2Data.fear / course2Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความประหลาดใจ: {course2Data.surprise} ({((course2Data.surprise / course2Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>ความรังเกียจ: {course2Data.disgust} ({((course2Data.disgust / course2Data.totalDetections) * 100).toFixed(1)}%)</p>
                  <p>เป็นกลาง: {course2Data.neutral} ({((course2Data.neutral / course2Data.totalDetections) * 100).toFixed(1)}%)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}