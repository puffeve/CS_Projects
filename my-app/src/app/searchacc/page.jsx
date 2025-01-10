'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]); // เก็บรายการบัญชี
  const [searchTerm, setSearchTerm] = useState(''); // เก็บคำค้นหา
  const [selectedRole, setSelectedRole] = useState('all'); // เก็บบทบาทที่เลือก
  const [userName, setUserName] = useState(''); // เก็บชื่อผู้ใช้
  const router = useRouter();

  // ดึงข้อมูลจาก Supabase และ LocalStorage
  useEffect(() => {
    fetchAccounts();
    const user = JSON.parse(localStorage.getItem('user')); // ดึงข้อมูลจาก LocalStorage
    if (user) {
      setUserName(user.name); // ตั้งค่า userName
    } else {
      router.push('/login'); // หากไม่มีข้อมูลผู้ใช้ ให้กลับไปหน้า login
    }
  }, []);

  async function fetchAccounts() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('user_id', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
    } else {
      setAccounts(data);
    }
  }

  // ฟังก์ชันลบข้อมูล
  async function deleteAccount(user_id) {
    if (confirm('คุณต้องการลบบัญชีนี้หรือไม่?')) {
      const { error } = await supabase.from('users').delete().eq('user_id', user_id);
      if (error) {
        console.error('Error deleting account:', error);
      } else {
        fetchAccounts();
      }
    }
  }

  // ฟังก์ชัน Log out
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/login');
    }
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || account.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold">ClassMood Insight</h1>
          {/* แสดงชื่อผู้ใช้ */}
          {userName && <p className="text-lg font-semibold mt-4">สวัสดี {userName}</p>}
          <hr className="border-sky-300 my-6" />
          <nav>
          <a href="/searchacc" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลบัญชี</a>
          <a href="/searchcourse" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลรายวิชา</a>
          <a href="/searchimg" className="block py-2.5 px-4 mt-3 bg-sky-600 hover:bg-sky-400 rounded-lg">จัดการข้อมูลใบหน้า</a>
        </nav>
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 text-white px-4 py-2 rounded-lg mt-auto"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">จัดการข้อมูลบัญชี</h1>

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
            onClick={() => console.log('Searching for:', searchTerm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            ค้นหา
          </button>
        </div>

        {/* ปุ่ม Option สำหรับกรองบทบาท */}
        <div className="mb-4 flex items-center gap-4">
          <label htmlFor="role-select" className="font-bold">กรองตามบทบาท:</label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">ทั้งหมด</option>
            <option value="teacher">อาจารย์ผู้สอน</option>
            <option value="student">ผู้เรียน</option>
            <option value="admin">ผู้ดูแลระบบ</option>
          </select>
          <button
            onClick={() => router.push('/Adduser')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            เพิ่มบัญชี
          </button>
        </div>

        {/* ตารางรายการบัญชี */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <table className="table-auto w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">ลำดับ</th>
                <th className="border px-4 py-2">ชื่อ</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">บทบาท</th>
                <th className="border px-4 py-2">เบอร์โทรศัพท์</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.user_id} className="border-b">
                  <td className="border px-4 py-2">{account.user_id}</td>
                  <td className="border px-4 py-2">{account.name}</td>
                  <td className="border px-4 py-2">{account.email}</td>
                  <td className="border px-4 py-2">{account.role}</td>
                  <td className="border px-4 py-2">{account.phone}</td>
                  <td className="border px-4 py-2">
                    <button
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
                      onClick={() => router.push(`/Edituser?id=${account.user_id}`)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg ml-2"
                      onClick={() => deleteAccount(account.user_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
