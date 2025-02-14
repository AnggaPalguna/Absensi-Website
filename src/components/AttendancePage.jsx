"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { database } from "../../firebase-config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AttendanceTable() {
    const [attendance, setAttendance] = useState({});
    const [imageUrls, setImageUrls] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [availableDates, setAvailableDates] = useState([]);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const storage = getStorage();

    useEffect(() => {
        const attendanceRef = ref(database, "attendance");
        onValue(attendanceRef, async (snapshot) => {
            const data = snapshot.val() || {};
            setAttendance(data);
            setAvailableDates(Object.keys(data));

            let urls = {};
            for (const date in data) {
                for (const uid in data[date]) {
                    const imgName = data[date][uid].imageUrl;
                    if (imgName) {
                        try {
                            const imageRef = storageRef(storage, `${imgName}`);
                            const url = await getDownloadURL(imageRef);
                            urls[`${date}-${uid}`] = url;
                        } catch (error) {
                            console.error("Error fetching image URL", error);
                        }
                    }
                }
            }
            setImageUrls(urls);
        });
    }, []);

    const generatePDF = () => {
        const doc = new jsPDF();
        const selectedMonthYear = selectedDate.slice(0, 7); // Format: YYYY-MM
        const monthYearFormatted = new Date(`${selectedMonthYear}-01`).toLocaleString("id-ID", { month: "long", year: "numeric" });
    
        // Ambil semua tanggal dalam bulan yang dipilih
        const year = parseInt(selectedMonthYear.split("-")[0]);
        const month = parseInt(selectedMonthYear.split("-")[1]) - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let filteredData = [];
        let noCounter = 1; // Untuk nomor di tabel
    
        for (let day = 1; day <= daysInMonth; day++) {
            const formattedDate = `${selectedMonthYear}-${String(day).padStart(2, "0")}`;
            const isSunday = new Date(formattedDate).getDay() === 0; // Cek apakah hari Minggu
    
            // Tambahkan tanggal sebagai pembatas
            filteredData.push({
                isDateRow: true,
                date: formattedDate,
                isSunday: isSunday
            });
    
            if (attendance[formattedDate]) {
                Object.entries(attendance[formattedDate]).forEach(([uid, record]) => {
                    filteredData.push({
                        isDateRow: false,
                        no: noCounter++, // Nomor tetap bertambah, melewati baris tanggal
                        name: record.name || "-",
                        time: record.time || "-",
                        status: record.status || "-",
                    });
                });
            } else {
                filteredData.push({
                    isDateRow: false,
                    no: noCounter++,
                    name: "-",
                    time: "-",
                    status: "-",
                });
            }
        }
    
        // Tambahkan Logo di Kiri Atas
        const logoUrl = "https://media.discordapp.net/attachments/908689619296583730/1339803501018087444/Delibird-Pokemon-Go.png?ex=67b00cbe&is=67aebb3e&hm=27a421a5e2729b90f425d1d405e23968b7365de5034241afee6f8417e4aa6ccb&=&format=webp&quality=lossless&width=375&height=375"; // Ganti dengan URL gambar/logo
        doc.addImage(logoUrl, "PNG", 15, 15, 15, 15); // Posisi (x, y) dan ukuran (width, height)
    
        // Header
        doc.setFontSize(18);
        doc.text("Laporan Absensi", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text(monthYearFormatted, 105, 30, null, null, "center");
    
        // Garis pembatas header dan tabel
        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);
    
        // Tabel hitam putih dengan tanggal sebagai pembatas
        autoTable(doc, {
            startY: 40,
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }, // Header hitam dengan teks putih
            bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] }, // Body putih dengan teks hitam
            styles: { fontSize: 10, cellPadding: 3, halign: "center" },
            head: [["No", "Nama", "Waktu", "Status"]],
            body: filteredData.map((row) => {
                if (row.isDateRow) {
                    return [
                        { 
                            content: `Tanggal: ${row.date}`, 
                            colSpan: 4, 
                            styles: { 
                                fontStyle: "bold", 
                                halign: "center", 
                                textColor: row.isSunday ? [255, 0, 0] : [0, 0, 0] 
                            } 
                        }
                    ];
                } else {
                    return [
                        row.no,
                        row.name,
                        row.time,
                        row.status
                    ];
                }
            }),
        });
    
     // **Tambahkan Tanda Tangan Langsung di Bawah Tabel**
     const finalY = doc.lastAutoTable.finalY + 20; // Posisi setelah tabel

     doc.setFontSize(12);
     doc.text("Mengetahui,", 140, finalY);
     doc.text("Kepala", 140, finalY + 8);
     doc.text("(___________________)", 140, finalY + 35); // Jarak untuk tanda tangan
    
        // Buat Blob untuk Preview
        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(pdfUrl);
    };
    
    
    

    // Fungsi Download PDF
    const downloadPDF = () => {
        if (pdfPreviewUrl) {
            const link = document.createElement("a");
            link.href = pdfPreviewUrl;
            link.download = `Laporan_Absensi_${selectedDate.slice(0, 7)}.pdf`;
            link.click();
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
        }
    };

    return (
        <div className="container mx-auto py-6 max-w-full">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Attendance Records</h1>

            {/* Filter Date & Print Button */}
            <div className="flex justify-between items-center mb-4 gap-4">
                <div>
                    <label className="font-semibold text-gray-700">Filter by Date: </label>
                    <select
                        className="border border-gray-400 text-gray-700 px-2 py-2 rounded-md ml-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    >
                        {/* Tambahkan selectedDate ke opsi jika tidak tersedia */}
                        {!availableDates.includes(selectedDate) && (
                            <option value={selectedDate}>{selectedDate}</option>
                        )}
                        {availableDates.map((date) => (
                            <option key={date} value={date}>
                                {date}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Print Button */}
                <button
                    onClick={generatePDF}
                    className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    🖨 Print Preview
                </button>
            </div>

            {/* Modal Preview PDF */}
            {pdfPreviewUrl && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-11/12 max-w-3xl relative">
                        <h2 className="text-lg font-semibold mb-2">Preview PDF</h2>
                        <iframe src={pdfPreviewUrl} className="w-full h-[500px] border" />

                        <div className="mt-4 flex justify-between">
                            <button
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                                onClick={() => setPdfPreviewUrl(null)}
                            >
                                ✕ Close
                            </button>
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                onClick={downloadPDF}
                            >
                                ⬇ Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabel Data */}
            <div className="overflow-x-auto">
                <table className="w-full border border-gray-400 shadow-md">
                    <thead>
                        <tr className="bg-gray-300 text-gray-800 text-xs md:text-base">
                            <th className="border border-gray-400 py-2">No</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Nama</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Tanggal</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Waktu</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Status</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Gambar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance[selectedDate] ? (
                            Object.entries(attendance[selectedDate]).map(([uid, record], index) => (
                                <tr key={`${selectedDate}-${uid}`} className="border-b border-gray-300 text-xs md:text-base hover:bg-gray-100 transition text-slate-800">
                                    <td className="border border-gray-300 py-2 text-center">{index + 1}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.name || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{selectedDate}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.time || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.status || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">
                                        {imageUrls[`${selectedDate}-${uid}`] ? (
                                            <img
                                                src={imageUrls[`${selectedDate}-${uid}`]}
                                                alt="Gambar"
                                                className="h-[30px] w-[40px] md:h-[100px] md:w-[120px] object-cover cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => setSelectedImage(imageUrls[`${selectedDate}-${uid}`])}
                                            />
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-gray-600">
                                    No data available for {selectedDate}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Modal Pop-up */}
            {selectedImage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                    <div className="relative">
                        <img src={selectedImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg shadow-lg" />
                        <button
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-[80px] w-10 hover:bg-red-800"
                            onClick={() => setSelectedImage(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
