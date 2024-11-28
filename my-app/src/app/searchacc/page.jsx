'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // ดึงข้อมูลจาก Supabase
  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching accounts:", error);
    } else {
      setAccounts(data);
    }
  }

  // ฟังก์ชันลบข้อมูล
  async function deleteAccount(id) {
    if (confirm("คุณต้องการลบบัญชีนี้หรือไม่?")) {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        console.error("Error deleting account:", error);
      } else {
        fetchAccounts(); // อัปเดตรายการ
      }
    }
  }

  // ฟังก์ชัน Log out
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      router.push('/login'); // เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between">
        <div className="p-4">
          <h1 className="text-2xl font-bold">ClassMood Insight</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 text-white px-4 py-2 m-4 rounded-lg"
        >
          Log out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">จัดการบัญชี</h1>

        {/* ช่องค้นหา */}
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="ค้นหาบัญชี"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-4 py-2 w-full max-w-md"
          />
          <button
            onClick={() => console.log("Searching for:", searchTerm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            ค้นหา
          </button>
        </div>

        {/* ปุ่มเพิ่มบัญชี */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/Adduser')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            เพิ่มบัญชี
          </button>
        </div>

        {/* ตารางรายการบัญชี */}
        <div className="bg-white rounded-lg shadow-md p-4">
          {accounts
            .filter((account) =>
              account.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between border-b py-2"
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-gray-500 text-sm">{account.email}</p>
                  <p className="text-gray-500 text-sm">{account.phone}</p>
                  <p className="text-gray-500 text-sm">{account.role}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
                    onClick={() => router.push(`/Edituser?id=${account.id}`)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-lg"
                    onClick={() => deleteAccount(account.id)}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
