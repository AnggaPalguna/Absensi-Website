"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config"; 
import { ref, get, update } from "firebase/database";

export default function EditEmployee({ uid }) {
  const [employee, setEmployee] = useState({ name: "", status: "" });
  const router = useRouter();

  useEffect(() => {
    if (uid) {
      const fetchEmployee = async () => {
        const employeeRef = ref(database, `employees/${uid}`);
        const snapshot = await get(employeeRef);
        if (snapshot.exists()) {
          setEmployee(snapshot.val());
        }
      };
      fetchEmployee();
    }
  }, [uid]);

  const handleChange = (e) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const employeeRef = ref(database, `employees/${uid}`);
    await update(employeeRef, employee);
    router.push("/employe"); // Redirect kembali ke daftar karyawan
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Edit Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={employee.name}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
          placeholder="Name"
        />
        <input
          type="text"
          name="status"
          value={employee.status}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
          placeholder="Status"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Save</button>
      </form>
    </div>
  );
}
