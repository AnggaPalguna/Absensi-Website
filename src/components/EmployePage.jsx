"use client"; // Tambahkan ini di baris pertama

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Gunakan next/navigation untuk App Router
import { database } from "../../firebase-config"; 
import { ref, get, update } from "firebase/database";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      const employeesRef = ref(database, "employees");
      const snapshot = await get(employeesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const employeeList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setEmployees(employeeList);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} onClick={() => router.push(`/employe/${employee.id}`)} />
      ))}
    </div>
  );
}

// EmployeeCard component
export function EmployeeCard({ employee, onClick }) {
  return (
    <div 
      className="cursor-pointer p-4 hover:shadow-lg border rounded-lg" 
      onClick={onClick}
    >
      <h2 className="text-xl font-bold text-gray-500">{employee.name}</h2>
      <p className="text-slate-600">Status: {employee.status}</p>
      <p className="text-sm text-gray-500">Created At: {new Date(employee.createdat).toLocaleDateString()}</p>
    </div>
  );
}
