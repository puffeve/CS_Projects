'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }

  async function deleteAccount(id) {
    if (confirm("คุณต้องการลบบัญชีนี้หรือไม่?")) {
      try {
        const { error } = await supabase.from("users").delete().eq("id", id);
        if (error) throw error;
        fetchAccounts();
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/searchacc')}
              className="bg-sky-300 text-black px-4 py-2 rounded-lg text-left"
            >
              จัดการบัญชี
            </button>
            <button
              onClick={() => router.push('/searchcourse')}
              className="bg-sky-300 text-black px-4 py-2 rounded-lg text-left"
            >
              จัดการรายวิชา
            </button>
            <button
              onClick={() => router.push('/FaceDataManagement')}
              className="bg-sky-300 text-black px-4 py-2 rounded-lg text-left"
            >
              จัดการข้อมูลใบหน้า
            </button>
          </div>
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
        <h1 className="text-2xl font-bold mb-4 text-center">จัดการบัญชี</h1>
        <div className="flex items-center justify-center gap-4 mb-4">
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
        <div className="mb-4 text-center">
          <button
            onClick={() => router.push('/Adduser')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            เพิ่มบัญชี
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account, index) => (
              <div
                key={account.id || index}
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
            ))
          ) : (
            <p className="text-gray-500">ไม่มีบัญชีที่ตรงกับการค้นหา</p>
          )}
        </div>
      </div>
    </div>
  );
}
