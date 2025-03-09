'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart } from 'recharts';

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
  const [comparisonType, setComparisonType] = useState("daily"); // "daily" or "monthly"
  
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

  // New states for enhanced analysis
  const [faceCountData, setFaceCountData] = useState({
    course1: { totalFaces: 0, maxFaces: 0, minFaces: 0 },
    course2: { totalFaces: 0, maxFaces: 0, minFaces: 0 }
  });
  
  const [periodAnalysis, setPeriodAnalysis] = useState({
    course1: null,
    course2: null
  });
  
  const [emotionTimelines, setEmotionTimelines] = useState({
    course1: [],
    course2: []
  });
  
  const [analysisInsights, setAnalysisInsights] = useState({
    course1: [],
    course2: []
  });

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

  // Enhanced period analysis function
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
    const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust', 'sad', 'angry', 'fearful', 'disgusted'];
    
    // สร้างข้อมูลสำหรับกราฟไทม์ไลน์อารมณ์
    const timelineData = {};

    // วนลูปวิเคราะห์ข้อมูลแต่ละรายการ
    data.forEach(item => {
      const itemTime = new Date(item.detection_time);
      const emotion = item.emotion.toLowerCase();
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
        if (i + j >= sortedTimeline.length) continue;
        
        const item = sortedTimeline[i + j];
        let itemNegativeCount = 0;
        
        // นับอารมณ์ด้านลบในช่วงนั้น
        for (const emotion of Object.keys(item.emotions)) {
          if (negativeEmotions.includes(emotion)) {
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
      if (negativePercent >= 40 && windowItems.length > 0) {
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

  // Function to generate insights for analysis
  const getAnalysisInsights = (emotionData, emotionCounts, faceCountData) => {
    if (!emotionData || !emotionCounts || !faceCountData) return [];
    
    const insights = [];
    
    // เพิ่มข้อมูลเชิงลึกเกี่ยวกับจำนวนนักเรียน
    if (faceCountData.totalFaces > 0) {
      if (faceCountData.maxFaces - faceCountData.minFaces > 5) {
        insights.push(`มีความแตกต่างของจำนวนนักเรียนในการเก็บข้อมูลนี้ค่อนข้างมาก (${faceCountData.minFaces} - ${faceCountData.maxFaces} คน) อาจมีนักเรียนเข้า-ออกระหว่างคาบ`);
      }
    }
    
    // เพิ่มข้อมูลเชิงลึกเกี่ยวกับอารมณ์
    const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    
    // วิเคราะห์อารมณ์เชิงบวก-ลบ
    const positiveEmotions = (emotionCounts.happy || 0) + (emotionCounts.surprise || 0);
    const negativeEmotions = (emotionCounts.sad || 0) + (emotionCounts.angry || 0) + 
                           (emotionCounts.fear || 0) + (emotionCounts.disgust || 0);
    const neutralEmotions = emotionCounts.neutral || 0;
    
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

  // Function to toggle comparison type
  const toggleComparisonType = (type) => {
    setComparisonType(type);
    resetSelections();
    
    if (course1) {
      if (type === "daily") {
        fetchCourseTimes(course1, setCourse1Times);
      } else if (type === "monthly") {
        fetchCourseMonths(course1, setCourse1Months);
      }
    }
    
    if (course2) {
      if (type === "daily") {
        fetchCourseTimes(course2, setCourse2Times);
      } else if (type === "monthly") {
        fetchCourseMonths(course2, setCourse2Months);
      }
    }
  };

  const resetSelections = () => {
    // Reset all time-related selections
    setSelectedTime1('');
    setSelectedTime2('');
    setSelectedMonth1('');
    setSelectedMonth2('');
    
    // Reset data
    setCourse1Data(null);
    setCourse2Data(null);
    setComparisonData(null);
    setError(null);
    
    // Reset enhanced analysis data
    setFaceCountData({
      course1: { totalFaces: 0, maxFaces: 0, minFaces: 0 },
      course2: { totalFaces: 0, maxFaces: 0, minFaces: 0 }
    });
    setPeriodAnalysis({
      course1: null,
      course2: null
    });
    setEmotionTimelines({
      course1: [],
      course2: []
    });
    setAnalysisInsights({
      course1: [],
      course2: []
    });
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

  const fetchCourseEmotionData = async (courseId, dateTime, setCourseDataFunction, courseKey) => {
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
      
      const startOfDay = new Date(dateTime + 'T00:00:00');
      const endOfDay = new Date(dateTime + 'T23:59:59');
      
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('*')
        .eq('courses_id', courseIdInt)
        .gte('detection_time', startOfDay.toISOString())
        .lt('detection_time', endOfDay.toISOString());
        
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
      
      // Process period analysis
      const periodResult = analyzePeriods(data, startOfDay.toISOString(), endOfDay.toISOString());
      setPeriodAnalysis(prev => ({ ...prev, [courseKey]: periodResult }));
      
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
      
      setFaceCountData(prev => ({
        ...prev,
        [courseKey]: {
          totalFaces,
          maxFaces,
          minFaces
        }
      }));

      // Calculate emotion counts for analysis insights
      const emotions = {
        happy: 0, sad: 0, angry: 0, fear: 0, surprise: 0, neutral: 0, disgust: 0
      };
      
      data.forEach(record => {
        const emotion = record.emotion ? record.emotion.toLowerCase() : '';
        
        if (emotion === 'happiness') emotions.happy++;
        else if (emotion === 'sadness') emotions.sad++;
        else if (emotion === 'anger') emotions.angry++;
        else if (emotion === 'fear') emotions.fear++;
        else if (emotion === 'surprise') emotions.surprise++;
        else if (emotion === 'disgust') emotions.disgust++;
        else if (emotion === 'neutral') emotions.neutral++;
        else if (emotion === 'happy') emotions.happy++;
        else if (emotion === 'sad') emotions.sad++;
      });
      
      // Generate insights
      const insights = getAnalysisInsights(
        emotions, // emotionPercentages (we'll calculate in the function)
        emotions, // emotionCounts
        { totalFaces, maxFaces, minFaces } // faceCountData
      );
      
      setAnalysisInsights(prev => ({
        ...prev,
        [courseKey]: insights
      }));

      // Get course details from courses array
      const courseDetails = courses.find(course => parseInt(course.courses_id, 10) === courseIdInt);
      
      console.log(`Successfully processed emotion data:`, emotions);
      setCourseDataFunction({
        ...emotions,
        courseName: courseDetails ? courseDetails.namecourses : `วิชา ${courseId}`,
        courseId: courseId,
        selectedDate: selectedDate.toISOString(),
        selectedType: 'day',
        totalDetections: data.length
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

  const fetchCourseEmotionDataByMonth = async (courseId, yearMonth, setCourseDataFunction, courseKey) => {
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
      
      const startOfMonth = new Date(`${yearMonth}-01T00:00:00`);
      const endOfMonth = new Date(`${nextMonth}-01T00:00:00`);
      endOfMonth.setMilliseconds(endOfMonth.getMilliseconds() - 1);
      
      const { data, error } = await supabase
        .from('emotion_detection')
        .select('*')
        .eq('courses_id', courseIdInt)
        .gte('detection_time', startOfMonth.toISOString())
        .lt('detection_time', endOfMonth.toISOString());
        
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

      // Process period analysis
      const periodResult = analyzePeriods(data, startOfMonth.toISOString(), endOfMonth.toISOString());
      setPeriodAnalysis(prev => ({ ...prev, [courseKey]: periodResult }));
      
      // Calculate face count data and other analysis
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
      
      setFaceCountData(prev => ({
        ...prev,
        [courseKey]: {
          totalFaces,
          maxFaces,
          minFaces
        }
      }));

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

      // Generate insights
      const insights = getAnalysisInsights(
        emotionCounts,
        emotionCounts,
        { totalFaces, maxFaces, minFaces }
      );
      
      setAnalysisInsights(prev => ({
        ...prev,
        [courseKey]: insights
      }));

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
      }
    } else {
      setCourse1Times([]);
      setCourse1Months([]);
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
      }
    } else {
      setCourse2Times([]);
      setCourse2Months([]);
    }
  };

  const handleTime1Change = (e) => {
    const time = e.target.value;
    setSelectedTime1(time);
    setComparisonData(null);
    setError(null);
    
    if (time) {
      fetchCourseEmotionData(course1, time, setCourse1Data, 'course1');
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
      fetchCourseEmotionData(course2, time, setCourse2Data, 'course2');
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
      fetchCourseEmotionDataByMonth(course1, month, setCourse1Data, 'course1');
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
      fetchCourseEmotionDataByMonth(course2, month, setCourse2Data, 'course2');
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
        
        {/* คำอธิบายประโยชน์ของผลวิเคราะห์ */}
        <div className="bg-blue-50 p-4 my-4 rounded-lg shadow border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">ประโยชน์ของการเปรียบเทียบผลการวิเคราะห์อารมณ์ระหว่างรายวิชา</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>เปรียบเทียบอารมณ์ของผู้เรียนระหว่างรายวิชาที่แตกต่างกัน เพื่อวิเคราะห์ความชอบและความสนใจของนักเรียน</li>
            <li>ค้นหาความแตกต่างระหว่างรายวิชาที่มีอารมณ์เชิงบวกสูงและรายวิชาที่มีอารมณ์เชิงลบสูง</li>
            <li>ประเมินประสิทธิภาพของเทคนิคการสอนที่แตกต่างกันระหว่างรายวิชา</li>
            <li>ช่วยในการวางแผนและออกแบบหลักสูตรให้เหมาะสมกับธรรมชาติของแต่ละรายวิชา</li>
            <li>สร้างเกณฑ์เปรียบเทียบ (Benchmark) เพื่อพัฒนาการเรียนการสอนให้ดียิ่งขึ้น</li>
          </ul>
        </div>
        
        {/* Comparison Type Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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

            {/* ส่วนแสดงข้อมูลจำนวนใบหน้า */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-blue-800 font-semibold mb-2">{course1Data.courseName}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-white p-2 rounded-lg shadow">
                    <h5 className="text-blue-600 font-semibold">จำนวนการตรวจจับอารมณ์ทั้งหมด</h5>
                    <p className="text-2xl font-bold">{faceCountData.course1?.totalFaces || 0} ครั้ง</p>
                  </div>
                  <div className="text-center bg-white p-2 rounded-lg shadow">
                    <h5 className="text-blue-600 font-semibold">จำนวนใบหน้าสูงสุด</h5>
                    <p className="text-2xl font-bold">{faceCountData.course1?.maxFaces || 0} ใบหน้า</p>
                  </div>
                  <div className="text-center bg-white p-2 rounded-lg shadow">
                    <h5 className="text-blue-600 font-semibold">จำนวนใบหน้าต่ำสุด</h5>
                    <p className="text-2xl font-bold">{faceCountData.course1?.minFaces || 0} ใบหน้า</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-blue-800 font-semibold mb-2">{course2Data.courseName}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-white p-2 rounded-lg shadow">
                    <h5 className="text-blue-600 font-semibold">จำนวนการตรวจจับอารมณ์ทั้งหมด</h5>
                    <p className="text-2xl font-bold">{faceCountData.course2?.totalFaces || 0} ครั้ง</p>
                  </div>
                  <div className="text-center bg-white p-2 rounded-lg shadow">
                    <h5 className="text-blue-600 font-semibold">จำนวนใบหน้าสูงสุด</h5>
                    <p className="text-2xl font-bold">{faceCountData.course2?.maxFaces || 0} ใบหน้า</p>
                  </div>
                  <div className="text-center bg-white p-2 rounded-lg shadow">
                    <h5 className="text-blue-600 font-semibold">จำนวนใบหน้าต่ำสุด</h5>
                    <p className="text-2xl font-bold">{faceCountData.course2?.minFaces || 0} ใบหน้า</p>
                  </div>
                </div>
              </div>
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
              {periodAnalysis.course1 && periodAnalysis.course1.negativeEmotionPeaks && periodAnalysis.course1.negativeEmotionPeaks.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h4 className="text-amber-800 font-semibold text-lg mb-2">การวิเคราะห์ช่วงเวลาที่มีอารมณ์ด้านลบ - {course1Data.courseName}</h4>
                  <div className="space-y-2">
                    {periodAnalysis.course1.negativeEmotionPeaks.map((peak, peakIndex) => {
                      const startTime = new Date(peak.startTime);
                      const endTime = new Date(peak.endTime);
                      
                      // Format display based on comparison type
                      let timeDisplay;
                      if (comparisonType === "monthly") {
                        const day = startTime.getDate();
                        const month = startTime.toLocaleString('th-TH', { month: 'long' });
                        const year = startTime.getFullYear() + 543; // Convert to Buddhist era
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
              )}

              {periodAnalysis.course2 && periodAnalysis.course2.negativeEmotionPeaks && periodAnalysis.course2.negativeEmotionPeaks.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h4 className="text-amber-800 font-semibold text-lg mb-2">การวิเคราะห์ช่วงเวลาที่มีอารมณ์ด้านลบ - {course2Data.courseName}</h4>
                  <div className="space-y-2">
                    {periodAnalysis.course2.negativeEmotionPeaks.map((peak, peakIndex) => {
                      const startTime = new Date(peak.startTime);
                      const endTime = new Date(peak.endTime);
                      
                      // Format display based on comparison type
                      let timeDisplay;
                      if (comparisonType === "monthly") {
                        const day = startTime.getDate();
                        const month = startTime.toLocaleString('th-TH', { month: 'long' });
                        const year = startTime.getFullYear() + 543; // Convert to Buddhist era
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
              )}
            </div>



            {/* แสดงกราฟเส้นไทม์ไลน์อารมณ์ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {periodAnalysis.course1 && periodAnalysis.course1.emotionTimeline && periodAnalysis.course1.emotionTimeline.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-gray-800 font-semibold text-lg mb-2">ไทม์ไลน์อารมณ์ - {course1Data.courseName}</h4>
                  <div style={{ height: "200px" }}>
                    <LineChart
                      width={500}
                      height={200}
                      data={periodAnalysis.course1.emotionTimeline.map(item => {
                        const time = new Date(item.time);
                        return {
                          time: comparisonType === "monthly" 
                            ? `วันที่ ${time.getDate()}` 
                            : time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                          happy: (item.emotions.happiness || 0) + (item.emotions.happy || 0),
                          sad: (item.emotions.sadness || 0) + (item.emotions.sad || 0),
                          angry: (item.emotions.anger || 0) + (item.emotions.angry || 0),
                          fear: (item.emotions.fear || 0) + (item.emotions.fearful || 0),
                          surprise: (item.emotions.surprise || 0) + (item.emotions.surprised || 0),
                          neutral: (item.emotions.neutral || 0),
                          disgust: (item.emotions.disgust || 0) + (item.emotions.disgusted || 0)
                        };
                      })}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="happy" stroke="#FFD700" />
                      <Line type="monotone" dataKey="sad" stroke="#4682B4" />
                      <Line type="monotone" dataKey="angry" stroke="#FF6347" />
                      <Line type="monotone" dataKey="fear" stroke="#9932CC" />
                      <Line type="monotone" dataKey="surprise" stroke="#00CED1" />
                      <Line type="monotone" dataKey="neutral" stroke="#A9A9A9" />
                      <Line type="monotone" dataKey="disgust" stroke="#8B4513" />
                    </LineChart>
                  </div>
                </div>
              )}

              {periodAnalysis.course2 && periodAnalysis.course2.emotionTimeline && periodAnalysis.course2.emotionTimeline.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-gray-800 font-semibold text-lg mb-2">ไทม์ไลน์อารมณ์ - {course2Data.courseName}</h4>
                  <div style={{ height: "200px" }}>
                    <LineChart
                      width={500}
                      height={200}
                      data={periodAnalysis.course2.emotionTimeline.map(item => {
                        const time = new Date(item.time);
                        return {
                          time: comparisonType === "monthly" 
                            ? `วันที่ ${time.getDate()}` 
                            : time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                          happy: (item.emotions.happiness || 0) + (item.emotions.happy || 0),
                          sad: (item.emotions.sadness || 0) + (item.emotions.sad || 0),
                          angry: (item.emotions.anger || 0) + (item.emotions.angry || 0),
                          fear: (item.emotions.fear || 0) + (item.emotions.fearful || 0),
                          surprise: (item.emotions.surprise || 0) + (item.emotions.surprised || 0),
                          neutral: (item.emotions.neutral || 0),
                          disgust: (item.emotions.disgust || 0) + (item.emotions.disgusted || 0)
                        };
                      })}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="happy" stroke="#FFD700" />
                      <Line type="monotone" dataKey="sad" stroke="#4682B4" />
                      <Line type="monotone" dataKey="angry" stroke="#FF6347" />
                      <Line type="monotone" dataKey="fear" stroke="#9932CC" />
                      <Line type="monotone" dataKey="surprise" stroke="#00CED1" />
                      <Line type="monotone" dataKey="neutral" stroke="#A9A9A9" />
                      <Line type="monotone" dataKey="disgust" stroke="#8B4513" />
                    </LineChart>
                  </div>
                </div>
              )}
            </div>

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

            {/* เพิ่มส่วนการวิเคราะห์และข้อเสนอแนะ */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisInsights.course1 && analysisInsights.course1.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-xl font-semibold text-indigo-800 mb-2">การวิเคราะห์และข้อเสนอแนะ - {course1Data.courseName}</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    {analysisInsights.course1.map((insight, insightIndex) => (
                      <li key={insightIndex} className="text-gray-800">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisInsights.course2 && analysisInsights.course2.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-xl font-semibold text-indigo-800 mb-2">การวิเคราะห์และข้อเสนอแนะ - {course2Data.courseName}</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    {analysisInsights.course2.map((insight, insightIndex) => (
                      <li key={insightIndex} className="text-gray-800">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}