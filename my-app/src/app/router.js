import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherPage from './Teacher_dashboard/page';
import FaceAnalysisPage from './analyze_face/page'; // ตรวจสอบว่า path นี้ตรงกับไฟล์ที่คุณย้าย

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher-dashboard" element={<TeacherPage />} />
        <Route path="/analyze_face" element={<FaceAnalysisPage />} /> {/* แก้ path ให้ตรง */}
      </Routes>
    </Router>
  );
}

export default AppRouter;