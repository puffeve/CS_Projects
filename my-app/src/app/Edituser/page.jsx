'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Sidebar Component
function Sidebar({ userName, onLogout }) {
    return (
        <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4 h-screen">
            <div>
                <h1 className="text-2xl font-bold">ClassMood Insight</h1>
                {userName && <p className="text-lg font-semibold mt-4">สวัสดี {userName}</p>}
                <hr className="border-sky-300 my-6" />
                <nav>
          <a href="/searchacc" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลบัญชี</a>
          <a href="/searchcourse" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลรายวิชา</a>
          
        </nav>
            </div>
            <div className="flex-grow"></div>
            <button
                onClick={onLogout}
                className="bg-pink-400 text-white px-4 py-2 rounded-lg"
            >
                ออกจากระบบ
            </button>
        </div>
    );
}

// Edit Account Page
export default function EditAccount() {
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
    });

    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    const router = useRouter();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUserName(storedUser.name);
        } else {
            router.push('/login');
        }
    }, []);

    const fetchUserData = async () => {
        if (!userId) return;

        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (userData) {
            setUser(userData);
            setFormData({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
            });
        }

        if (error) console.error('Error fetching user data:', error);
    };

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSave = async () => {
        const { error } = await supabase
            .from('users')
            .update({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
            })
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating user data:', error);
            alert('Error saving changes.');
        } else {
            alert('Changes saved successfully!');
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    return (
        <div className="flex">
            <Sidebar userName={userName} onLogout={handleLogout} />
            <div className="flex-1 p-10 flex justify-center items-center">
                <div className="bg-sky-50 p-12 rounded-lg shadow-md w-full max-w-4xl">
                    <h1 className="text-3xl font-bold mb-6">แก้ไขบัญชีผู้ใช้</h1>
                    <div className="space-y-6">
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
                                <option value="admin">ผู้ดูแลระบบ</option>
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
