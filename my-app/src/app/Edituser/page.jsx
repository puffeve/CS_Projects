'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Sidebar Component
function Sidebar({ userName, onLogout }) {
    return (
      <div className="flex flex-col h-screen w-64 bg-sky-200 text-black">
        <div className="p-4 text-lg font-bold border-b border-gray-700">
          ClassMood Insight
        </div>
        <div className="flex-grow p-4">
          <div className="text-center font-semibold">{userName}</div>
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
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      phone: "",
      role: "", // เพิ่ม Role ในแบบฟอร์ม
    });
  
    const fetchUserData = async () => {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id")
        .single();
  
      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role, // ดึง Role จากฐานข้อมูล
        });
      }
  
      if (error) console.error("Error fetching user data:", error);
    };
  
    useEffect(() => {
      fetchUserData();
    }, []);
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };
  
    const handleSave = async () => {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role, // อัปเดต Role
        })
        .eq("id", user.id);
  
      if (error) {
        console.error("Error updating user data:", error);
        alert("Error saving changes.");
      } else {
        alert("Changes saved successfully!");
      }
    };
  
    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        window.location.href = "/login";
      }
    };
  
    return (
      <div className="flex">
        <Sidebar userName={user?.name} onLogout={handleLogout} />
        <div className="flex-grow p-8">
          <h1 className="text-2xl font-bold mb-4">Edit Account</h1>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
              >
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }
