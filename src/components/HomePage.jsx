"use client";
import { useEffect, useState } from "react";
import { database } from "../../firebase-config";
import { ref, get } from "firebase/database";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Loading from "./Loading";
import { LogIn, LogOut} from "lucide-react";

export default function HomePage() {
  const [employees, setEmployees] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const getOuterRadius = () => (window.innerWidth < 768 ? 50 : 80);

    // Filter employees based on search query
    const filteredEmployees = () => {
      if (!searchQuery.trim()) {
        return Object.values(employees);
      }
      return Object.values(employees).filter(employee => 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    };
  
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
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  
  // Filter attendance data for current month only
  const monthlyReport = Object.entries(attendance)
    .filter(([dateKey]) => {
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
  const formattedDate = `${month} ${year}`;

  const employeeStatusCount = {};

  monthlyReport.forEach(entry => {
    if (!employeeStatusCount[entry.name]) {
        employeeStatusCount[entry.name] = {
            checkin: {
                "Lebih Awal": 0,
                "Tepat Waktu": 0,
                "Terlambat": 0,
                "Tidak Hadir": 0
            },
            checkout: {
                "Lebih Awal": 0,
                "Tepat Waktu": 0,
                "Lembur": 0,
                "Tidak Hadir": 0
            },
            absence: 0 // Tambahkan properti absence untuk menghitung ketidakhadiran
        };
    }
    
    if (entry.status) {
        employeeStatusCount[entry.name].checkin[entry.status] = 
            (employeeStatusCount[entry.name].checkin[entry.status] || 0) + 1;
    }
  
    if (entry.status_checkout) {
        employeeStatusCount[entry.name].checkout[entry.status_checkout] = 
            (employeeStatusCount[entry.name].checkout[entry.status_checkout] || 0) + 1;
    }

    // Logika perhitungan tidak hadir
    const isCheckinAbsent = entry.status === "Tidak Hadir";
    const isCheckoutAbsent = entry.status_checkout === "Tidak Hadir";
    
    if (isCheckinAbsent || isCheckoutAbsent) {
        employeeStatusCount[entry.name].absence += 1;
    }
});

  // Calculate statistics for check-in status
  const statusCount = monthlyReport.reduce((acc, entry) => {
    if (entry.status && entry.status !== "Tidak Hadir") {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate statistics for check-out status
  const statusCheckoutCount = monthlyReport.reduce((acc, entry) => {
    if (entry.status_checkout && entry.status_checkout !== "Tidak Hadir") {
      acc[entry.status_checkout] = (acc[entry.status_checkout] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate attendance (present vs absent) - FIXED IMPLEMENTATION
  // Now accounting for both check-in and check-out status
  const attendanceCount = {
    "Hadir": 0,
    "Tidak Hadir": 0
  };

  monthlyReport.forEach(entry => {
    // Check if either check-in or check-out status is "Tidak Hadir"
    if (entry.status === "Tidak Hadir" || entry.status_checkout === "Tidak Hadir") {
      attendanceCount["Tidak Hadir"]++;
    } else if (entry.status && entry.status_checkout) {
      // Only count as present if both check-in and check-out have valid statuses
      attendanceCount["Hadir"]++;
    } else if (entry.status && !entry.status_checkout) {
      // If there's check-in but no check-out status, count as present
      // This handles cases where checkout might not have happened yet
      attendanceCount["Hadir"]++;
    } else {
      // For any other cases (like missing check-in but having check-out)
      attendanceCount["Tidak Hadir"]++;
    }
  });

  // Define default status categories even if there's no data
  const defaultStatusCategories = {
    "Lebih Awal": 0,
    "Tepat Waktu": 0,
    "Terlambat": 0
  };

  const defaultCheckoutCategories = {
    "Lebih Awal": 0,
    "Tepat Waktu": 0,
    "Lembur": 0
  };

  const defaultAttendanceCategories = {
    "Hadir": 0,
    "Tidak Hadir": 0
  };

  // Merge default categories with actual data
  const mergedStatusCount = { ...defaultStatusCategories, ...statusCount };
  const mergedCheckoutCount = { ...defaultCheckoutCategories, ...statusCheckoutCount };
  const mergedAttendanceCount = { ...defaultAttendanceCategories, ...attendanceCount };

  // Convert to chart data format
  const pieDataStatus = Object.entries(mergedStatusCount).map(([status, count]) => ({ name: status, value: count }));
  const pieDataCheckout = Object.entries(mergedCheckoutCount).map(([status, count]) => ({ name: status, value: count }));
  const pieDataAttendance = Object.entries(mergedAttendanceCount).map(([status, count]) => ({ name: status, value: count }));

  // Check if there's any data for each chart
  const hasStatusData = Object.values(statusCount).some(count => count > 0);
  const hasCheckoutData = Object.values(statusCheckoutCount).some(count => count > 0);
  const hasAttendanceData = Object.values(attendanceCount).some(count => count > 0);

  // Enhanced color schemes for better visual appeal
  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];
  const ATTENDANCE_COLORS = ["#10B981", "#EF4444"]; // Green for present, Red for absent
  
  // Gray color for empty charts
  const EMPTY_COLOR = "#D1D5DB"; // A medium gray color

  // Status color mapping for text
  const getStatusColor = (status) => {
    switch(status) {
      case "Tepat Waktu": return "text-emerald-500";
      case "Lebih Awal": return "text-blue-500";
      case "Terlambat": return "text-amber-500";
      case "Lembur": return "text-purple-500";
      case "Tidak Hadir": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const emptyData = [{ name: "Tidak Ada Data", value: 1 }];

  return (
    <div className="">
      {/* Header with improved styling */}
      <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard Kehadiran</h1>
          <p className="">Ringkasan kehadiran karyawan dan laporan bulanan</p>
      </div>

      <div className=" mx-auto px-4 mt-4">

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Karyawan</p>
              <h3 className="text-3xl font-bold text-indigo-700">{totalEmployees}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Kehadiran Bulan Ini</p>
              <h3 className="text-3xl font-bold text-emerald-600">{attendanceCount["Hadir"] || 0}</h3>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tidak Hadiran Bulan ini</p>
              <h3 className="text-3xl font-bold text-red-600">{attendanceCount["Tidak Hadir"] || 0}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

          {/* Information Cards with enhanced design */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 ">
          <h2 className="text-2xl font-bold mb-5 text-center text-indigo-800">Catatan Penting</h2>
          <div className="flex flex-col md:flex-row justify-center gap-8 lg:gap-16">
            {/* Web Explanation */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-indigo-50 p-4 rounded-lg">
              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                  className="w-full h-full object-cover"
                  alt="Aplikasi Web"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-indigo-700">Tentang Aplikasi Web</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Sistem monitoring kehadiran karyawan secara real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Fitur termasuk laporan harian, bulanan, dan statistik kehadiran</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Data tersimpan aman di cloud database Firebase</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Device Explanation */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-indigo-50 p-4 rounded-lg mt-4 md:mt-0">
              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="w-full h-full object-cover"
                  alt="Perangkat"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-indigo-700">Tentang Perangkat</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Menggunakan sensor RFID untuk verifikasi identitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Terhubung langsung dengan sistem untuk update data real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Dilengkapi dengan Kamera untuk menyimpan gambar</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Employee Status */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden py-5">
            <div className=" p-4">
            <div className="flex flex-col md:flex-row md:items-center">
              {/* Bagian Status Karyawan */}
              <div>
                <h2 className="text-xl font-bold">Status karyawan</h2>
                <p>Bulan {formattedDate}</p>
              </div>

              {/* Input Pencarian */}
              <div className="mt-3 md:mt-3 relative w-full md:w-64 md:ml-8">
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 absolute left-2 top-2.5 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto ">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Use filteredEmployees() instead of Object.values(employees) */}
                {filteredEmployees().length > 0 ? (
                  filteredEmployees().map((employee, index) => {
                    const status = employeeStatusCount[employee.name] || { 
                      checkin: { "Lebih Awal": 0, "Tepat Waktu": 0, "Terlambat": 0, "Tidak Hadir": 0 },
                      checkout: { "Lebih Awal": 0, "Tepat Waktu": 0, "Lembur": 0, "Tidak Hadir": 0 },
                      absence: 0
                    };

                    return (
                      <div key={index} className="border border-gray-200 p-3 rounded-lg hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0 mt-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h3 className="font-semibold text-gray-800 truncate">{employee.name}</h3>
                        </div>
                        

                        <div className="space-y-6 mt-6">
                          <div className="bg-gray-50 p-2 rounded-md">
                            <div className="flex items-center">
                              <LogIn className="text-green-500" size={15} />
                              <p className="font-semibold text-sm text-gray-700 ml-2">Waktu Masuk:</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mr-2">
                              <div className="flex items-center gap-1">
                                <span>Lebih Awal: {status.checkin["Lebih Awal"] || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Tepat Waktu: {status.checkin["Tepat Waktu"] || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Terlambat: {status.checkin["Terlambat"] || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center">
                              <LogOut className="text-orange-500" size={15} />
                              <p className="font-semibold text-sm text-gray-700 ml-2">Waktu Keluar:</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <span>Lebih Awal: {status.checkout["Lebih Awal"] || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Tepat Waktu: {status.checkout["Tepat Waktu"] || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Lembur: {status.checkout["Lembur"] || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center gap-1">
                                <span className="text-red-500">🚫</span>
                                <span>Tidak Hadir: {status.absence || 0}</span>
                              </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 p-8 text-center bg-white border border-gray-200 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Tidak ada karyawan ditemukan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        

          {/* Daily Report */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className=" p-4">
              <h2 className="text-xl font-bold">Laporan Harian ({today})</h2>
              <p className="">Kehadiran karyawan hari ini</p>
            </div>
            
            <div className="p-1 md:p-4">
              {Object.keys(dailyReport).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 md:px-14 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Masuk</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Keluar</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(dailyReport).map((entry, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 md:px-14 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.name}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)} bg-opacity-10`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status_checkout)} bg-opacity-10`}>
                              {entry.status_checkout}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Belum ada data absensi hari ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Report Charts */}
        <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden h-auto mb-4">
          <div className=" p-4">
            <h2 className="text-xl font-bold">Laporan Keseluruhan Karyawan</h2>
            <p className="">Bulan {formattedDate}</p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-bold text-center mb-4 text-gray-800">Kehadiran</h3>
              
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  {hasAttendanceData ? (
                    
                    <Pie
                      className="text-xs"
                      data={pieDataAttendance}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      //filter data with 0 value
                      label={({ name, percent }) =>
                        percent > 0.01 && window.innerWidth >= 768
                          ? `${name}: ${(percent * 100).toFixed(0)}%`
                          : null
                      }
                    >
                      {pieDataAttendance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                      ))}
                    </Pie>
                  ) : (
                    // Show gray placeholder chart when no data
                    <Pie
                      className="text-xs"
                      data={emptyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#E0E0E0"
                      dataKey="value"
                    />
                  )}
                  {hasAttendanceData && <Tooltip formatter={(value, name) => [`${value}`, name]} />}
                </PieChart>
              </ResponsiveContainer>
              
              {hasAttendanceData ? (
                // Show legend only when there's data
                <div className="flex justify-center mt-4 gap-4">
                  {pieDataAttendance.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-3 h-3 inline-block rounded-full" style={{ backgroundColor: ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length] }}></span>
                      <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Show message when no data
                <p className="text-center text-gray-500 text-sm mt-2">Data tidak ditemukan</p>
              )}
            </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-bold text-center mb-4 text-gray-800">Waktu Masuk</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                  {hasStatusData ? (
                    <Pie
                      className="text-xs"
                      data={pieDataStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent > 0.01 && window.innerWidth >= 768
                          ? `${name}: ${(percent * 100).toFixed(0)}%`
                          : null
                      }
                    >
                      {pieDataStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                      ) : (
                        // Show gray placeholder chart when no data
                        <Pie
                          className="text-xs"
                          data={emptyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#E0E0E0"
                          dataKey="value"
                        />
                      )}
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {hasStatusData ? (
                <div className="flex flex-wrap justify-center mt-4 gap-x-4 gap-y-2">
                  {pieDataStatus.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-3 h-3 inline-block rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
                ) : (
                  // Show message when no data
                  <p className="text-center text-gray-500 text-sm mt-2">Data tidak ditemukan</p>
                )}
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-bold text-center mb-4 text-gray-800">Waktu Keluar</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                  {hasCheckoutData ? (
                    <Pie
                      className="text-xs"
                      data={pieDataCheckout}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent > 0.01 && window.innerWidth >= 768
                          ? `${name}: ${(percent * 100).toFixed(0)}%`
                          : null
                      }
                    >
                      {pieDataCheckout.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                      ) : (
                        // Show gray placeholder chart when no data
                        <Pie
                          className="text-xs"
                          data={emptyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#E0E0E0"
                          dataKey="value"
                        />
                      )}
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {hasCheckoutData ? (
                <div className="flex flex-wrap justify-center mt-4 gap-x-4 gap-y-2">
                  {pieDataCheckout.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-3 h-3 inline-block rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
                 ) : (
                  // Show message when no data
                  <p className="text-center text-gray-500 text-sm mt-2">Data tidak ditemukan</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}