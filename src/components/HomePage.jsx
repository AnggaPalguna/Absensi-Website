"use client";
import { useEffect, useState } from "react";
import { database } from "../../firebase-config";
import { ref, get } from "firebase/database";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Loading from "./Loading";

export default function HomePage() {
  const [employees, setEmployees] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const employeesRef = ref(database, "employees");
        const attendanceRef = ref(database, "attendance");
        
        const employeesSnapshot = await get(employeesRef);
        const attendanceSnapshot = await get(attendanceRef);
        
        setEmployees(employeesSnapshot.exists() ? employeesSnapshot.val() : {});
        setAttendance(attendanceSnapshot.exists() ? attendanceSnapshot.val() : {});
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  const totalEmployees = Object.keys(employees).length;
  const today = new Date().toISOString().split("T")[0];
  const dailyReport = attendance[today] || {};
  
  // Get current month and year
  const date = new Date();
  const currentMonth = date.getMonth(); // 0-based (0 for January, 11 for December)
  const currentYear = date.getFullYear();
  
  // Filter attendance data for current month only
  const monthlyReport = Object.entries(attendance)
    .filter(([dateKey]) => {
      // Extract month and year from date string (format: YYYY-MM-DD)
      const recordDate = new Date(dateKey);
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear;
    })
    .flatMap(([_, dayData]) => Object.values(dayData));

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const formattedDate = ` ${month} ${year} `;

  const employeeStatusCount = {};

  monthlyReport.forEach(entry => {
    if (!employeeStatusCount[entry.name]) {
      employeeStatusCount[entry.name] = {
        checkin: {
          "Lebih Awal": 0,
          "Tepat Waktu": 0,
          "Terlambat": 0,
          "Tidak Hadir": 0,
          "Tidak Absen": 0
        },
        checkout: {
          "Lebih Awal": 0,
          "Tepat Waktu": 0,
          "Lembur": 0,
          "Lembur Tidak Sah": 0
        }
      };
    }
    
    // Fixed: Handle missing status fields with null checks
    if (entry.status) {
      employeeStatusCount[entry.name].checkin[entry.status] = 
        (employeeStatusCount[entry.name].checkin[entry.status] || 0) + 1;
    }
  
    if (entry.status_checkout) {
      employeeStatusCount[entry.name].checkout[entry.status_checkout] = 
        (employeeStatusCount[entry.name].checkout[entry.status_checkout] || 0) + 1;
    }
  });

  // Calculate statistics for check-in status
  const statusCount = monthlyReport.reduce((acc, entry) => {
    if (entry.status && entry.status !== "Tidak Hadir") { // Exclude "Tidak Hadir"
      acc[entry.status] = (acc[entry.status] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate statistics for check-out status
  const statusCheckoutCount = monthlyReport.reduce((acc, entry) => {
    if (entry.status_checkout && entry.status_checkout !== "Tidak Hadir") { // Exclude "Tidak Hadir" if it exists
      acc[entry.status_checkout] = (acc[entry.status_checkout] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate attendance (present vs absent)
  const attendanceCount = {
    "Hadir": 0,
    "Tidak Hadir": 0
  };

  monthlyReport.forEach(entry => {
    if (entry.status === "Tidak Hadir") {
      attendanceCount["Tidak Hadir"]++;
    } else {
      attendanceCount["Hadir"]++;
    }
  });

  const pieDataStatus = Object.entries(statusCount).map(([status, count]) => ({ name: status, value: count }));
  const pieDataCheckout = Object.entries(statusCheckoutCount).map(([status, count]) => ({ name: status, value: count }));
  const pieDataAttendance = Object.entries(attendanceCount).map(([status, count]) => ({ name: status, value: count }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  const ATTENDANCE_COLORS = ["#00C49F", "#FF8042"]; // Green for present, Orange for absent

  return (
    <div className="p-6">
      {/* Title Page */}
      <div className="mb-6 ">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Ringkasan kehadiran karyawan dan laporan bulanan</p>
      </div>

      <div className="border rounded-lg shadow p-6 mb-6 mx-auto">
        <h2 className="text-2xl font-bold mb-5 text-center">Catatan Penting</h2>
        <div className="flex justify-center flex-col md:flex-row gap-12 md:gap-60">
          {/* Web Explanation */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <img
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              className="w-32 h-32 object-cover rounded"
              alt="Aplikasi Web"
            />
            <div>
              <h3 className="font-semibold mb-2">Tentang Aplikasi Web</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Sistem ini digunakan untuk monitoring kehadiran karyawan secara real-time</li>
                <li>Fitur termasuk laporan harian, bulanan, dan statistik kehadiran</li>
                <li>Data tersimpan aman di cloud database Firebase</li>
              </ul>
            </div>
          </div>

          {/* Device Explanation */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <img
              src="https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              className="w-32 h-32 object-cover rounded"
              alt="Perangkat"
            />
            <div>
              <h3 className="font-semibold mb-2">Tentang Perangkat</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Menggunakan sensor sidik jari untuk verifikasi identitas</li>
                <li>Terhubung langsung dengan sistem untuk update data real-time</li>
                <li>Dilengkapi dengan baterai tahan lama dan koneksi WiFi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <div className="border rounded-lg shadow p-4 w-full max-w-screen-lg mx-auto max-h-[380px] overflow-y-auto">
          <h2 className="text-lg md:text-xl font-bold text-center">
            Jumlah Karyawan ({totalEmployees})
          </h2>
          <h3 className="text-md md:text-lg mt-4 text-center">
            Status karyawan pada bulan {formattedDate}
          </h3>

          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(employees).map((employee, index) => {
              const status = employeeStatusCount[employee.name] || { checkin: {}, checkout: {} };

              return (
                <li key={index} className="border p-3 rounded-lg shadow-sm bg-white text-center">
                  <h3 className="text-md md:text-lg font-semibold">{employee.name}</h3>

                  <div className="mt-2">
                    <p className="font-semibold text-sm md:text-base">Waktu Masuk:</p>
                    <p className="text-sm">💨 Lebih Awal: {status.checkin["Lebih Awal"] || 0}</p>
                    <p className="text-sm">✅ Tepat Waktu: {status.checkin["Tepat Waktu"] || 0}</p>
                    <p className="text-sm">⏳ Terlambat: {status.checkin["Terlambat"] || 0}</p>
                    <p className="text-sm">⚠️ Tidak Absen: {status.checkin["Tidak Absen"] || 0}</p>
                  </div>
                  
                  <div className="mt-2">
                    <p className="font-semibold text-sm md:text-base">Waktu Keluar:</p>
                    <p className="text-sm">💨 Lebih Awal: {status.checkout["Lebih Awal"] || 0}</p>
                    <p className="text-sm">✅ Tepat Waktu: {status.checkout["Tepat Waktu"] || 0}</p>
                    <p className="text-sm">⏳ Lembur: {status.checkout["Lembur"] || 0}</p>
                    <p className="text-sm">⚠️ Lembur Tidak Sah: {status.checkout["Lembur Tidak Sah"] || 0}</p>
                  </div>

                  <p className="font-semibold text-sm md:text-base">🚫 Tidak Hadir: {status.checkin["Tidak Hadir"] || 0}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border rounded-lg shadow p-4">
          <h2 className="text-lg md:text-xl font-bold text-center">Laporan Harian ({today})</h2>
          {Object.keys(dailyReport).length > 0 ? (
            <ul>
              <li className="grid grid-cols-3 font-semibold border-b pb-2 mb-2 text-center text-sm md:text-base md:mt-8 mt-4 items-center">
                <span>Name</span>
                <span>Status (Waktu Masuk)</span>
                <span>Status (Waktu Keluar)</span>
              </li>
              {Object.values(dailyReport).map((entry, index) => (
                <li key={index} className="grid grid-cols-3 text-center py-1 text-[13px] md:text-base md:py-">
                  <span>{entry.name}</span>
                  <span className={`w-full ${entry.status === "Tepat Waktu" ? "text-green-500" : "text-red-500"}`}>{entry.status}</span>
                  <span className={`w-full ${entry.status_checkout === "Tepat Waktu" ? "text-green-500" : "text-red-500"}`}>{entry.status_checkout}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">Belum ada data absensi hari ini.</p>
          )}
        </div>

        <div className="border rounded-lg shadow p-4 col-span-1 md:col-span-2">
          <h2 className="text-xl font-bold mb-10 text-center">Laporan Keseluruhan karyawan pada bulan {formattedDate}</h2>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full z-[0]">
              <h3 className="text-lg font-bold text-center">Kehadiran</h3>
              <ResponsiveContainer width="100%" height={280} z-index={-40}>
                <PieChart>
                  <Pie
                    data={pieDataAttendance}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieDataAttendance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="justify-center mt-4 flex flex-wrap gap-2">
                {pieDataAttendance.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-4 h-4 inline-block rounded" style={{ backgroundColor: ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length] }}></span>
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full z-[0]">
              <h3 className="text-lg font-bold text-center">Waktu Masuk</h3>
              <ResponsiveContainer width="100%" height={280} z-index={-40}>
                <PieChart>
                  <Pie
                    data={pieDataStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieDataStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="justify-center mt-4 flex flex-wrap gap-2">
                {pieDataStatus.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-4 h-4 inline-block rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
              
            <div className="w-full z-[0]">
              <h3 className="text-lg font-bold text-center">Waktu Keluar</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieDataCheckout}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieDataCheckout.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="justify-center mt-4 flex flex-wrap gap-2">
                {pieDataCheckout.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-4 h-4 inline-block rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}