"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { database } from "../../firebase-config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { IconButton } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Padding } from "@mui/icons-material";

export default function AttendanceTable() {
    const [attendance, setAttendance] = useState({});
    const [imageUrls, setImageUrls] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("sv-SE"));
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
                            console.log("Error fetching image URL:", error);
                        }
                    }
                }
            }
            setImageUrls(urls);
        });
    }, []);

    // Fungsi Generate PDF
    const generatePDF = () => {
        const doc = new jsPDF();
        const selectedMonthYear = selectedDate.slice(0, 7); // Format: YYYY-MM
        const monthYearFormatted = new Date(`${selectedMonthYear}-01`).toLocaleString("id-ID", { month: "long", year: "numeric" });
    
        const year = parseInt(selectedMonthYear.split("-")[0]);
        const month = parseInt(selectedMonthYear.split("-")[1]) - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let filteredData = [];
        let noCounter = 1;
    
        for (let day = 1; day <= daysInMonth; day++) {
            const formattedDate = `${selectedMonthYear}-${String(day).padStart(2, "0")}`;
            const isSunday = new Date(formattedDate).getDay() === 0;
    
            filteredData.push({ isDateRow: true, date: formattedDate, isSunday: isSunday });
    
            if (attendance[formattedDate]) {
                Object.entries(attendance[formattedDate]).forEach(([uid, record]) => {
                    filteredData.push({
                        isDateRow: false,
                        no: noCounter++,
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
    
        const logoUrl = "https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
        doc.addImage(logoUrl, "PNG", 15, 15, 15, 15);
    
        doc.setFontSize(18);
        doc.text("Laporan Absensi", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text(monthYearFormatted, 105, 30, null, null, "center");
        
        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);
    
        autoTable(doc, {
            startY: 40,
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
            styles: { fontSize: 10, cellPadding: 3, halign: "center" },
            head: [["No", "Nama", "Waktu", "Status"]],
            body: filteredData.map((row) => {
                if (row.isDateRow) {
                    return [{ 
                        content: `Tanggal: ${row.date}`, 
                        colSpan: 4, 
                        styles: { 
                            fontStyle: "bold", 
                            halign: "center", 
                            textColor: row.isSunday ? [255, 0, 0] : [0, 0, 0] 
                        } 
                    }];
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
    
        let finalY = doc.lastAutoTable.finalY + 20;
        
        // Cek apakah tanda tangan melebihi batas kertas
        if (finalY + 40 > doc.internal.pageSize.height) {
            doc.addPage();
            finalY = 20; // Reset posisi di halaman baru
        }
        
        doc.setFontSize(12);
        doc.text("Mengetahui,", 140, finalY);
        doc.text("Kepala", 140, finalY + 8);
        doc.text("(___________________)", 140, finalY + 35);
    
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
                <div className="flex flex-col md:flex-row md:gap-2 gap-1 ">
                    <label className="flex font-semibold text-gray-700 items-center">Filter by Date: </label>

                    {/* Calendar Icon & Date Picker */}
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                        sx={ { 
                            
                         } }
                        className="w-[70%] md:w-[40%] "
                            value={new Date(selectedDate)}
                            onChange={(newDate) => {
                                if (newDate) {
                                    setSelectedDate(new Date(newDate).toLocaleDateString("sv-SE"));
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    inputProps={{ ...params.inputProps, readOnly: true }}
                                />
                            )}
                        />
                    </LocalizationProvider>

                </div>

                {/* Print Button */}
                <button
                    onClick={generatePDF}
                    className="flex items-end bg-blue-600 text-white px-1 py-1 md:py-2 rounded-md hover:bg-blue-700 transitio text-sm md:text-base"
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
                                className="bg-gray-500 text-white py-1 px-2 md:px-4 md:py-2 rounded-md hover:bg-gray-700 text-sm md:text-base"
                                onClick={() => setPdfPreviewUrl(null)}
                            >
                                ✕ Close
                            </button>
                            <button
                                className="bg-green-600 text-white py-1 px-2 md:px-4 md:py-2 rounded-md hover:bg-green-700 text-sm md:text-base"
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
