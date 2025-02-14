"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, get, update, remove, set } from "firebase/database";

export default function EditEmployee({ uid }) {
  const [employee, setEmployee] = useState({ name: "", status: "" });
  const [availableUids, setAvailableUids] = useState([{ key: uid, value: uid }]); // Default UID saat ini
  const [newUid, setNewUid] = useState(uid);
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

    // Ambil daftar UID dari unregistereduid/
    const fetchUnregisteredUids = async () => {
      const unregRef = ref(database, "unregisteredUids");
      const snapshot = await get(unregRef);
      if (snapshot.exists()) {
        const unregUids = Object.entries(snapshot.val()).map(([key, value]) => ({
          key, // Key adalah uid di unregistered
          value, // Value adalah nilai UID yang sebenarnya
        }));
        setAvailableUids([{ key: uid, value: uid }, ...unregUids]); // Gabungkan dengan UID saat ini
      }
    };
    fetchUnregisteredUids();
  }, [uid]);

  const handleChange = (e) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const handleUidChange = (e) => {
    setNewUid(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUid.trim()) {
      alert("UID tidak boleh kosong!");
      return;
    }

    const updatedEmployee = {
      ...employee,
      updatedAt: new Date().toISOString(),
    };

    const oldRef = ref(database, `employees/${uid}`);
    const newRef = ref(database, `employees/${newUid}`);

    if (uid !== newUid) {
      // Pindahkan data ke UID baru
      await set(newRef, updatedEmployee);
      await remove(oldRef);
    } else {
      // Perbarui data jika UID tidak berubah
      await update(oldRef, updatedEmployee);
    }

    // Hapus UID dari unregistered jika dipilih
    const selectedUnregistered = availableUids.find((u) => u.value === newUid);
    if (selectedUnregistered && selectedUnregistered.key !== uid) {
      const unregRef = ref(database, `unregisteredUids/${selectedUnregistered.key}`);
      await remove(unregRef);
    }

    router.push("/employee"); // Redirect ke daftar karyawan
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-8">Edit Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          name="uid"
          value={newUid}
          onChange={handleUidChange}
          className="w-full p-2 border rounded text-black"
        >
          {availableUids.map(({ key, value }) => (
            <option key={key} value={value}>
              {value}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="name"
          value={employee.name}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
          placeholder="Name"
        />
        <select
          name="gender"
          value={employee.gender || ""}
          onChange={handleChange}
          className="w-full p-2 border rounded text-black"
        >
          <option value="" disabled>Pilih Gender</option>
          <option value="Male">Laki-laki</option>
          <option value="Female">Perempuan</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded  mr-4">Save</button>
        <button 
          type="button" 
          className="bg-red-500 text-white p-2 rounded"
          onClick={() => router.push("/employee")}
        >
          Back
        </button>
        
      </form>
    </div>
  );
}
