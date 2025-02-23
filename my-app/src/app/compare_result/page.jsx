"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";  // ใช้ usePathname แทน

const CompareResultPage = ({ handleSignOut, handleBackClick }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userName, setUserName] = useState(""); // ✅ เพิ่ม useState สำหรับ userName
  const router = useRouter();

   // ตรวจสอบว่าอยู่ในหน้า "ผลวิเคราะห์" หรือไม่
   const pathname = usePathname();
   console.log("Current Path:", pathname);
   const isResultPage = pathname === "/compare_result";  // ตรวจสอบว่าตรงกับ path "/compare_result" หรือไม่
   
     useEffect(() => {
       console.log("Current Path:", router.pathname);
     }, [router.pathname]);
     

  useEffect(() => {
    // ✅ ดึงค่าจาก LocalStorage
    const storedCourse = localStorage.getItem("selectedCourse");
    const storedUserName = localStorage.getItem("userName"); // ✅ ดึง userName

    if (storedCourse) {
      setSelectedCourse(JSON.parse(storedCourse));
    } else {
      router.push("/teacher_dashboard"); // ถ้าไม่มีข้อมูล ให้กลับไปเลือกวิชา
    }

    if (storedUserName) {
      setUserName(storedUserName); // ✅ ตั้งค่า userName
    } else {
      router.push("/teacher_dashboard"); // ถ้าไม่มี userName ให้กลับไปหน้า dashboard
    }
  }, [router]);

  if (!selectedCourse) {
    return <p className="text-center mt-10 text-xl">กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="flex h-screen">
      {/* แถบเมนูด้านซ้าย */}
      <div className="w-64 bg-sky-200 text-black p-4 relative">
        <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
        {userName && <div className="text-lg font-semibold mb-4">สวัสดี {userName}</div>}
        <hr className="border-[#305065] mb-6" />

        {/* ปุ่มออกจากระบบ */}
        <div className="absolute bottom-4 left-0 w-full px-4">
          <button
            onClick={handleSignOut}
            className="w-full block py-2.5 px-4 bg-pink-400 active:bg-[#1d2f3f] text-white rounded-lg"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* เมนูการทำรายการ */}
        <div className="mt-4 flex flex-col items-start space-y-2">
          <button
            onClick={() => router.push("/analyze_face")}
            className="w-full bg-sky-600 hover:bg-sky-400 text-white px-4 py-2 rounded-lg shadow-md  transition duration-300"
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
      </div>

      {/* เนื้อหาหลัก */}
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">
          ตอนนี้อยู่ในวิชา {selectedCourse.namecourses} (รหัส: {selectedCourse.courses_id})
        </h2>
        <p className="text-lg">ภาคเรียน: {selectedCourse.term} | ปีการศึกษา: {selectedCourse.year}</p>

        {/* เพิ่มข้อความที่ต้องการแสดง */}
        {isResultPage && (
    <h3 className="text-xl mt-4 mb-4">
      <span className="bg-pink-200 px-2 py-1 rounded">
        ตอนนี้อยู่ในหน้าผลเปรียบเทียบผลวิเคราะห์
      </span>
    </h3>
  )}

      </div>
    </div>
  );
};


export default CompareResultPage;
