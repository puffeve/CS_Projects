'use client'; // ใช้เพื่อบ่งบอกว่าไฟล์นี้ต้องใช้ในฝั่ง client-side ของ Next.js
import { useEffect, useState } from 'react'; // ใช้ hooks สำหรับจัดการสถานะและการดึงข้อมูล
import { useRouter } from 'next/navigation'; // ใช้สำหรับนำทางไปยังหน้าอื่นใน Next.js
import { supabase } from '@/lib/supabase'; // การเชื่อมต่อกับ Supabase (ฐานข้อมูลและการจัดการผู้ใช้)

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]); // สถานะสำหรับเก็บข้อมูลบัญชีผู้ใช้
  const [searchTerm, setSearchTerm] = useState(''); // สถานะสำหรับเก็บค่าคำค้นหา
  const [selectedRole, setSelectedRole] = useState('all'); // สถานะสำหรับเก็บบทบาทที่เลือก
  const [userName, setUserName] = useState(''); // สถานะสำหรับเก็บชื่อผู้ใช้ที่ล็อกอิน
  const [errorMessage, setErrorMessage] = useState(''); // สถานะสำหรับแสดงข้อความข้อผิดพลาด
  const [isSearchTriggered, setIsSearchTriggered] = useState(false); // สถานะสำหรับตรวจสอบว่ามีการค้นหาหรือไม่
  const router = useRouter(); // ใช้สำหรับการนำทาง

  // เมื่อโหลด component เสร็จ จะดึงข้อมูลบัญชีผู้ใช้จากฐานข้อมูล
  useEffect(() => {
    fetchAccounts();
    const user = JSON.parse(localStorage.getItem('user')); // ดึงข้อมูลผู้ใช้จาก localStorage
    if (user) {
      setUserName(user.name); // ถ้ามีผู้ใช้ให้ตั้งชื่อผู้ใช้
    } else {
      router.push('/login'); // ถ้าไม่มีผู้ใช้ให้นำทางไปหน้า login
    }
  }, []);

  // ฟังก์ชั่นดึงข้อมูลบัญชีผู้ใช้จากฐานข้อมูล
  async function fetchAccounts() {
    const { data, error } = await supabase
      .from('users')
      .select('*') // เลือกข้อมูลทั้งหมดจากตาราง users
      .order('user_id', { ascending: true }); // เรียงลำดับตาม user_id

    if (error) {
      console.error('Error fetching accounts:', error); // ถ้ามีข้อผิดพลาดในการดึงข้อมูล
    } else {
      setAccounts(data); // เก็บข้อมูลบัญชีผู้ใช้ที่ดึงมาได้
    }
  }

  // ฟังก์ชั่นลบบัญชีผู้ใช้
  async function deleteAccount(user_id) {
    if (confirm('คุณต้องการลบบัญชีนี้หรือไม่?')) { // ถามยืนยันก่อนลบ
      const { error } = await supabase.from('users').delete().eq('user_id', user_id); // ลบบัญชีผู้ใช้จากฐานข้อมูล
      if (error) {
        console.error('Error deleting account:', error); // ถ้ามีข้อผิดพลาด
      } else {
        fetchAccounts(); // รีเฟรชข้อมูลบัญชีผู้ใช้
      }
    }
  }

  // ฟังก์ชั่นออกจากระบบ
  async function handleLogout() {
    const { error } = await supabase.auth.signOut(); // ล็อคเอาท์ผู้ใช้
    if (error) {
      console.error('Error logging out:', error); // ถ้ามีข้อผิดพลาด
    } else {
      router.push('/login'); // ถ้าล็อคเอาท์สำเร็จ ให้นำทางไปหน้า login
    }
  }

  // ฟังก์ชั่นสำหรับค้นหาบัญชี
  const handleSearch = () => {
    if (!searchTerm.trim() && selectedRole === 'all') { // ถ้าไม่มีคำค้นหาหรือไม่ได้เลือกบทบาท
      setErrorMessage('กรุณากรอกข้อมูลหรือเลือกตัวเลือกก่อนทำการค้นหา'); // แสดงข้อความข้อผิดพลาด
      setIsSearchTriggered(false); // ไม่ให้ค้นหาต่อ
      return;
    }
    setErrorMessage(''); // ลบข้อความข้อผิดพลาด
    setIsSearchTriggered(true); // เปิดใช้งานการค้นหา
  };

  // ฟังก์ชั่นจัดการการเปลี่ยนแปลงคำค้นหา
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value); // เก็บคำค้นหาที่ผู้ใช้พิมพ์
    setIsSearchTriggered(false); // ไม่ให้ค้นหาเมื่อคำค้นหาเปลี่ยนแปลง
  };

  // ฟังก์ชั่นจัดการการเปลี่ยนแปลงบทบาทที่เลือก
  const handleRoleChange = (e) => {
    const newRole = e.target.value; // เก็บค่าบทบาทใหม่ที่เลือก
    if (newRole !== selectedRole) {
      setSelectedRole(newRole); // เปลี่ยนค่า selectedRole
      setIsSearchTriggered(false); // รีเซ็ตการค้นหาทุกครั้งที่เปลี่ยนบทบาท
    }
  };

  // ฟังก์ชั่นกรองบัญชีผู้ใช้ตามคำค้นหาหรือบทบาท
  const filteredAccounts = isSearchTriggered
    ? accounts.filter((account) => {
        const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()); // ค้นหาจากชื่อ
        const matchesRole = selectedRole === 'all' || account.role === selectedRole; // ค้นหาจากบทบาท
        return matchesSearch && matchesRole; // ส่งคืนบัญชีที่ตรงกับเงื่อนไขการค้นหา
      })
    : accounts; // ถ้ายังไม่ค้นหาให้แสดงข้อมูลทั้งหมด

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-sky-200 text-black flex flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold">ClassMood Insight</h1>
          {userName && <p className="text-lg font-semibold mt-4">สวัสดี {userName}</p>} {/* แสดงชื่อผู้ใช้ */}
          <hr className="border-black my-6" />
          <nav>
            <a href="/searchacc" className="block py-2.5 px-4 mt-3 bg-pink-400 hover:bg-pink-300 text-white rounded-lg">จัดการข้อมูลบัญชี</a>
            <a href="/searchcourse" className="block py-2.5 px-4 mt-3 bg-pink-400 hover:bg-pink-300 text-white rounded-lg">จัดการข้อมูลรายวิชา</a>
            
          </nav>
        </div>
        <button onClick={handleLogout} className="bg-red-400 active:bg-[#1d2f3f] text-white px-4 py-2 rounded-lg mt-auto">ออกจากระบบ</button> {/* ปุ่มออกจากระบบ */}
      </div>

      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">จัดการข้อมูลบัญชี</h1>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="ค้นหาบัญชี"
            value={searchTerm}
            onChange={handleSearchTermChange} // เมื่อมีการพิมพ์คำค้นหา
            className="border rounded-lg px-4 py-2 w-full max-w-md"
          />
          <select
            key={selectedRole}  // รีเฟรช Dropdown ทุกครั้งที่เปลี่ยนค่า
            value={selectedRole}
            onChange={handleRoleChange} // เมื่อมีการเลือกบทบาท
            className="border rounded-lg px-4 py-2"
          >
            <option value="all" disabled={selectedRole === 'all'}>เลือกบทบาท</option> {/* บทบาทที่ยังไม่ได้เลือก */}
            <option value="all">ทั้งหมด</option>
            <option value="teacher">อาจารย์ผู้สอน</option>
          
            <option value="admin">ผู้ดูแลระบบ</option>
          </select>
          <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded-lg">ค้นหา</button>
        </div>
        <button onClick={() => router.push('/Adduser')} className="bg-green-500 text-white px-4 py-2 rounded-lg mb-4">เพิ่มบัญชี</button>
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>} {/* แสดงข้อความข้อผิดพลาด */}

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
                    <button onClick={() => router.push(`/Edituser?id=${account.user_id}`)} className="bg-yellow-500 text-white px-3 py-1 rounded-lg">แก้ไข</button>
                    <button onClick={() => deleteAccount(account.user_id)} className="bg-red-500 text-white px-3 py-1 rounded-lg ml-2">ลบ</button>
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
