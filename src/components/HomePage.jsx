"use client";
import { useEffect, useState } from "react";
import { database } from "../../firebase-config";
import { ref, get } from "firebase/database";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Loading from "./Loading";

export default function HomePage() {
  const [employees, setEmployees] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true); // State untuk loading

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
      }finally {
        setLoading(false); // Setelah data dimuat, nonaktifkan loading
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <Loading />; // Tampilkan loading saat data masih dimuat
  }

  const totalEmployees = Object.keys(employees).length;
  const today = new Date().toISOString().split("T")[0];
  const dailyReport = attendance[today] || {};
  const monthlyReport = Object.values(attendance).flatMap(day => Object.values(day));

  const statusCount = monthlyReport.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1;
    return acc;
  }, {});

  // const pieData = Object.entries(statusCount).map(([status, count]) => ({
  //   name: status,
  //   value: count,
  // }));
  const statusCheckoutCount = monthlyReport.reduce((acc, entry) => {
    acc[entry.status_checkout] = (acc[entry.status_checkout] || 0) + 1;
    return acc;
  }, {});

  const pieDataStatus = Object.entries(statusCount).map(([status, count]) => ({ name: status, value: count }));
  const pieDataCheckout = Object.entries(statusCheckoutCount).map(([status, count]) => ({ name: status, value: count }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="p-6">
  {/* Title Page */}
  <div className="mb-6 ">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p className="text-gray-600">Ringkasan kehadiran karyawan dan laporan bulanan</p>
  </div>

  {/* Catatan Penting Card */}
  <div className="border rounded-lg shadow p-4 mb-6">
        <h2 className="text-2xl font-bold mb-5">Catatan Penting</h2>
        <div className="flex flex-col md:flex-row gap-8 3xl:gap-24 ">
          {/* Web Explanation */}
          <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex flex-col md:flex-row gap-4 ml-0">
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
    <div className="border rounded-lg shadow p-4">
      <h2 className="text-xl font-bold">Total Employees</h2>
      <p className="text-3xl font-semibold">{totalEmployees}</p>
    </div>

    <div className="border rounded-lg shadow p-4">
  <h2 className="text-xl font-bold mb-3">Daily Report ({today})</h2>
  {Object.keys(dailyReport).length > 0 ? (
    <ul>
      <li className="grid grid-cols-3 font-semibold border-b pb-2 mb-2 text-center">
        <span>Name</span>
        <span>Status Check In</span>
        <span>Status Check Out</span>
      </li>
      {Object.values(dailyReport).map((entry, index) => (
        <li key={index} className="grid grid-cols-3 text-center py-1">
          <span>{entry.name}</span>
          <span className={`w-full ${entry.status === "On Time" ? "text-green-500" : "text-red-500"}`}>{entry.status}</span>
          <span className={`w-full ${entry.status_checkout === "On Time" ? "text-green-500" : "text-red-500"}`}>{entry.status_checkout}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500">No attendance data available for today.</p>
  )}
</div>


    <div className="border rounded-lg shadow p-4 col-span-1 md:col-span-2">
      <h2 className="text-xl font-bold mb-10">Monthly Report</h2>


      <div className="flex flex-col lg:flex-row gap-4">
      <div className="w-full z-[0] ">
        <h3 className="text-lg font-bold text-center">Check In</h3>
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
      <h3 className="text-lg font-bold text-center">Check Out</h3>
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