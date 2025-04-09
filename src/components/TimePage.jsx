"use client";
import { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import { database } from "../../firebase-config";
import Modal from "./ui/Modal";
import { Alert } from "@/components/ui/alert";
import { Clock, LogIn, LogOut, Save, RotateCcw } from "lucide-react";

const TimePage = () => {
  const [workingHours, setWorkingHours] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dbRef = ref(database, "workingHours");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        setWorkingHours(snapshot.val());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setModalMessage("Gagal memuat data. Silakan coba lagi.");
      setModalType("error");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
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
    await fetchData();
  };

  const saveAutocek = async () => {
    try {
      await set(ref(database, "workingHours/autocek"), workingHours.autocek);
      setModalMessage("Absensi otomatis berhasil disimpan!");
      setModalType("success");
      setIsModalOpen(true);
    } catch (error) {
      setModalMessage("Gagal menyimpan data.");
      setModalType("error");
      setIsModalOpen(true);
    }
  };

  const saveCheckIn = async () => {
    try {
      const dbRef = ref(database, "workingHours/checkOut/start");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const checkOutStart = snapshot.val();
        const checkInEnd = workingHours.checkIn.end;

        // Fix parsing error - correct array indexing
        const checkInEndHour = parseInt(checkInEnd.split(":")[0], 10);
        const checkOutStartHour = parseInt(checkOutStart.split(":")[0], 10);

        if (checkInEndHour > checkOutStartHour - 3) {
          setModalMessage("Batas akhir check-in harus minimal 3 jam sebelum waktu mulai check-out!");
          setModalType("error");
          setIsModalOpen(true);
          return;
        }

        await set(ref(database, "workingHours/checkIn"), workingHours.checkIn);
        setModalMessage("Waktu masuk berhasil disimpan!");
        setModalType("success");
        setIsModalOpen(true);
      }
    } catch (error) {
      setModalMessage("Gagal menyimpan data.");
      setModalType("error");
      setIsModalOpen(true);
    }
  };

  const saveCheckOut = async () => {
    try {
      await set(ref(database, "workingHours/checkOut"), workingHours.checkOut);
      setModalMessage("Waktu keluar berhasil disimpan!");
      setModalType("success");
      setIsModalOpen(true);
    } catch (error) {
      setModalMessage("Gagal menyimpan data.");
      setModalType("error");
      setIsModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 mx-auto">
      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Pengaturan Waktu Kerja</h1>
        <p className="text-gray-600 mb-4">Atur jadwal absensi dan waktu kerja karyawan</p>
      </div>

      {workingHours && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Autocek */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <Clock className="text-blue-500 mr-2" size={24} />
              <h2 className="text-lg font-semibold text-gray-800">Absensi Otomatis</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Waktu sistem akan melakukan absensi otomatis untuk karyawan
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Absensi</label>
              <input
                type="time"
                value={workingHours.autocek}
                onChange={(e) => handleChange("autocek", "value", e.target.value)}
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={saveAutocek} 
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Save size={16} className="mr-2" />
                Simpan
              </button>
              <button 
                onClick={handleCancel} 
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <RotateCcw size={16} className="mr-2" />
                Batal
              </button>
            </div>
          </div>

          {/* Check-In */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <LogIn className="text-green-500 mr-2" size={24} />
              <h2 className="text-lg font-semibold text-gray-800">Waktu Masuk</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Rentang waktu yang diizinkan untuk karyawan melakukan check-in
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
              <input
                type="time"
                value={workingHours.checkIn.start}
                onChange={(e) => handleChange("checkIn", "start", e.target.value)}
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
              <input
                type="time"
                value={workingHours.checkIn.end}
                onChange={(e) => handleChange("checkIn", "end", e.target.value)}
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            {modalType === "error" && (
            <Alert variant="destructive">{modalMessage}</Alert>
            )}
            <div className="flex gap-2 mt-4">
              <button 
                onClick={saveCheckIn} 
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Save size={16} className="mr-2" />
                Simpan
              </button>
              <button 
                onClick={handleCancel} 
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <RotateCcw size={16} className="mr-2" />
                Batal
              </button>
            </div>
          </div>

          {/* Check-Out */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <LogOut className="text-orange-500 mr-2" size={24} />
              <h2 className="text-lg font-semibold text-gray-800">Waktu Keluar</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Rentang waktu yang diizinkan untuk karyawan melakukan check-out
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
              <input
                type="time"
                value={workingHours.checkOut.start}
                onChange={(e) => handleChange("checkOut", "start", e.target.value)}
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
              <input
                type="time"
                value={workingHours.checkOut.end}
                onChange={(e) => handleChange("checkOut", "end", e.target.value)}
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={saveCheckOut} 
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                <Save size={16} className="mr-2" />
                Simpan
              </button>
              <button 
                onClick={handleCancel} 
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <RotateCcw size={16} className="mr-2" />
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} message={modalMessage} type={modalType} />
    </div>
  );
};

export default TimePage;