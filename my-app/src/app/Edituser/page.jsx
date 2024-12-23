'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Sidebar Component
function Sidebar({ userName, onLogout }) {
    return (
        <div className="flex flex-col h-screen w-64 bg-sky-200 text-black">
            <div className="p-4 text-lg font-bold border-b border-gray-700">
                ClassMood Insight
            </div>
            <div className="flex-grow p-4">
                {/* พื้นที่ว่างใน Sidebar */}
            </div>
            <button
                onClick={onLogout}
                className="mb-4 mx-4 px-4 py-2 bg-pink-400 hover:bg-pink-200 rounded-md text-center"
            >
                Log out
            </button>
        </div>
    );
}

// Edit Account Page
export default function EditAccount() {
    const [user, setUser] = useState(null); // เก็บข้อมูลของผู้ใช้
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
    });

    const searchParams = useSearchParams();
    const userId = searchParams.get('id'); // ดึง user_id จาก URL

    // ฟังก์ชันดึงข้อมูลผู้ใช้จาก Supabase
    const fetchUserData = async () => {
        if (!userId) return;

        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId) // ใช้ user_id จาก URL
            .single();

        if (userData) {
            setUser(userData); // กำหนดข้อมูลผู้ใช้
            setFormData({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
            });
        }

        if (error) console.error('Error fetching user data:', error); // หากเกิดข้อผิดพลาด
    };

    // เมื่อโหลดหน้าผู้ใช้ก็จะดึงข้อมูล
    useEffect(() => {
        fetchUserData();
    }, [userId]);

    // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // ฟังก์ชันบันทึกการเปลี่ยนแปลงข้อมูล
    const handleSave = async () => {
        const { data, error } = await supabase
            .from('users')
            .update({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
            })
            .eq('user_id', userId); // ใช้ user_id จาก URL

        if (error) {
            console.error('Error updating user data:', error); // หากเกิดข้อผิดพลาด
            alert('Error saving changes.');
        } else {
            alert('Changes saved successfully!'); // แจ้งเตือนการบันทึกสำเร็จ
        }
    };

    // ฟังก์ชันสำหรับออกจากระบบ
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = '/login'; // เมื่อออกจากระบบแล้วจะไปหน้า login
        }
    };

    return (
        <div className="flex">
            <Sidebar userName={user?.name} onLogout={handleLogout} /> {/* Sidebar */}
            <div className="flex-1 p-10 flex justify-center items-center">
                {/* คอนเทนเนอร์หลักที่ใช้จัดตำแหน่งให้ฟอร์มอยู่ตรงกลาง */}
                <div className="bg-sky-50 p-12 rounded-lg shadow-md w-full max-w-4xl">
                    {/* เพิ่ม max-w-4xl เพื่อทำให้ฟอร์มใหญ่ขึ้น */}
                    <h1 className="text-3xl font-bold mb-6">แก้ไขบัญชีผู้ใช้</h1>
                    <div className="space-y-6">
                        {/* ฟอร์มสำหรับแก้ไขข้อมูล */}
                        <div>
                            <label className="block text-sm font-medium mb-1">ชื่อผู้ใช้</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">บทบาท</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border rounded-md"
                            >
                                <option value="teacher">อาจารย์ผู้สอน</option>
                                <option value="student">ผู้เรียน</option>
                            </select>
                        </div>
                        <div className="flex justify-center items-center mt-6">
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-lg"
                            >
                                บันทึกการแก้ไข
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
