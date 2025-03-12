"use client";
import { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import { database } from "../../firebase-config";
import Modal from "./ui/Modal";

const TimePage = () => {
    const [workingHours, setWorkingHours] = useState(null);
    const [modalMessage, setModalMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState("");
  
    useEffect(() => {
      fetchData();
    }, []);
  
    const fetchData = async () => {
      const dbRef = ref(database, "workingHours");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        setWorkingHours(snapshot.val());
      }
    };
  
    const handleChange = (section, key, value) => {
        if (section === "autocek") {
            setWorkingHours((prev) => ({
                ...prev,
                autocek: value,
            }));
        } else {
            setWorkingHours((prev) => ({
                ...prev,
                [section]: { ...prev[section], [key]: value },
            }));
        }
    };
  
    const handleCancel = async () => {
      await fetchData(); // Mengambil ulang data dari database
    };
  
    const saveAutocek = async () => {
      await set(ref(database, "workingHours/autocek"), workingHours.autocek);
      setModalMessage("Autocek berhasil disimpan!");
      setModalType("success");
      setIsModalOpen(true);
    };
  
    const saveCheckIn = async () => {
      const dbRef = ref(database, "workingHours/checkOut/start");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const checkOutStart = snapshot.val();
        const checkInEnd = workingHours.checkIn.end;
  
        const checkInEndHour = parseInt(checkInEnd.split(":"[0]), 10);
        const checkOutStartHour = parseInt(checkOutStart.split(":"[0]), 10);
  
        if (checkInEndHour > checkOutStartHour - 3) {
          setModalMessage("Batas akhir check-in harus minimal 3 jam sebelum waktu mulai check-out!");
          setModalType("error");
          setIsModalOpen(true);
          return;
        }
  
        await set(ref(database, "workingHours/checkIn"), workingHours.checkIn);
        setModalMessage("Check-in berhasil disimpan!");
        setModalType("success");
        setIsModalOpen(true);
      }
    };
  
    const saveCheckOut = async () => {
      await set(ref(database, "workingHours/checkOut"), workingHours.checkOut);
      setModalMessage("Check-out berhasil disimpan!");
      setModalType("success");
      setIsModalOpen(true);
    };
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Pengaturan Waktu</h1>
        {workingHours && (
          <div className="flex flex-wrap gap-6">
            {/* Autocek */}
            <div className="bg-gray-100 p-4 rounded-lg shadow w-full md:w-[32%]">
              <h2 className="text-lg font-semibold">Absensi Otomatis</h2>
              <input
                type="time"
                value={workingHours.autocek}
                onChange={(e) => handleChange("autocek", "value", e.target.value)}
                className="border p-2 rounded w-full mt-2"
              />
              <div className="flex gap-2 mt-4">
                <button onClick={saveAutocek} className="px-4 py-2 bg-blue-500 text-white rounded">
                  Simpan
                </button>
                <button onClick={handleCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
                  Batal
                </button>
              </div>
            </div>
  
            {/* Check-In */}
            <div className="bg-gray-100 p-4 rounded-lg shadow w-full  md:w-[32%]">
              <h2 className="text-lg font-semibold">Waktu Masuk</h2>
              <label className="block">Mulai</label>
              <input
                type="time"
                value={workingHours.checkIn.start}
                onChange={(e) => handleChange("checkIn", "start", e.target.value)}
                className="border p-2 rounded w-full mt-1"
              />
              <label className="block mt-2">Selesai</label>
              <input
                type="time"
                value={workingHours.checkIn.end}
                onChange={(e) => handleChange("checkIn", "end", e.target.value)}
                className="border p-2 rounded w-full mt-1"
              />
              <div className="flex gap-2 mt-4">
                <button onClick={saveCheckIn} className="px-4 py-2 bg-blue-500 text-white rounded">
                  Simpan
                </button>
                <button onClick={handleCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
                  Batal
                </button>
              </div>
            </div>
  
            {/* Check-Out */}
            <div className="bg-gray-100 p-4 rounded-lg shadow w-full  md:w-[32%]">
              <h2 className="text-lg font-semibold">Waktu Keluar</h2>
              <label className="block">Mulai</label>
              <input
                type="time"
                value={workingHours.checkOut.start}
                onChange={(e) => handleChange("checkOut", "start", e.target.value)}
                className="border p-2 rounded w-full mt-1"
              />
              <label className="block mt-2">Selesai</label>
              <input
                type="time"
                value={workingHours.checkOut.end}
                onChange={(e) => handleChange("checkOut", "end", e.target.value)}
                className="border p-2 rounded w-full mt-1"
              />
              <div className="flex gap-2 mt-4">
                <button onClick={saveCheckOut} className="px-4 py-2 bg-blue-500 text-white rounded">
                  Simpan
                </button>
                <button onClick={handleCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} message={modalMessage} type={modalType}/>
      </div>
    );
};
  
export default TimePage;
