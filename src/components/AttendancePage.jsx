"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { database } from "../../firebase-config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Loader2 } from 'lucide-react';

export default function AttendanceTable() {
    const [attendance, setAttendance] = useState({});
    const [imageUrls, setImageUrls] = useState({});
    const [checkoutImageUrls, setCheckoutImageUrls] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("sv-SE"));
    const [availableDates, setAvailableDates] = useState([]);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loadingImages, setLoadingImages] = useState(true); // State loading untuk gambar
    const storage = getStorage();
    const modalRef = useRef(null);

    // Function to close modal when clicking outside
    const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            setPdfPreviewUrl(null);
        }
    };

    useEffect(() => {
        const attendanceRef = ref(database, "attendance");
        onValue(attendanceRef, async (snapshot) => {
            const data = snapshot.val() || {};
            setAttendance(data);
            setAvailableDates(Object.keys(data));

            let urls = {};
            let checkoutUrls = {};
            setLoadingImages(true); // Set loading sebelum fetching gambar
            for (const date in data) {
                for (const uid in data[date]) {
                    // Process check-in images
                    const imgName = data[date][uid].imageUrl;
                    if (imgName) {
                        try {
                            const imageRef = storageRef(storage, `${imgName}`);
                            const url = await getDownloadURL(imageRef);
                            urls[`${date}-${uid}`] = url;
                        } catch (error) {
                            console.log("Error fetching check-in image URL:", error);
                        }
                    }
                    
                    // Process check-out images
                    const checkoutImgName = data[date][uid].imageUrl_checkout;
                    if (checkoutImgName) {
                        try {
                            const checkoutImageRef = storageRef(storage, `${checkoutImgName}`);
                            const checkoutUrl = await getDownloadURL(checkoutImageRef);
                            checkoutUrls[`${date}-${uid}`] = checkoutUrl;
                        } catch (error) {
                            console.log("Error fetching check-out image URL:", error);
                        }
                    }
                }
            }
            setImageUrls(urls);
            setCheckoutImageUrls(checkoutUrls);
            setLoadingImages(false); // Set loading selesai setelah semua gambar diambil
        });
        if (pdfPreviewUrl) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    },[pdfPreviewUrl]);

    // Function Generate PDF
    const generatePDF = () => {
        const doc = new jsPDF();
        const dateFormatted = new Date(selectedDate).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    
        const logoUrl = "https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
        doc.addImage(logoUrl, "PNG", 15, 15, 15, 15);
    
        doc.setFontSize(18);
        doc.text("Laporan Absensi Harian", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text(`Tanggal: ${dateFormatted}`, 105, 30, null, null, "center");
        
        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);
    
        autoTable(doc, {
            startY: 40,
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
            styles: { fontSize: 10, cellPadding: 3, halign: "center" },
            head: [["No", "Nama", "Waktu Masuk", "Status Masuk", "Waktu Keluar", "Status Keluar"]],
            body: attendance[selectedDate] ? 
                Object.entries(attendance[selectedDate]).map(([uid, record], index) => [
                    index + 1,
                    record.name || "-",
                    record.time || "-",
                    record.status || "-",
                    record.time_checkout || "-",
                    record.status_checkout || "-"
                ]) : 
                [["No data available", "-", "-", "-", "-", "-"]],
        });
    
        let finalY = doc.lastAutoTable.finalY + 20;
        
        // Check if signature exceeds page boundary
        if (finalY + 40 > doc.internal.pageSize.height) {
            doc.addPage();
            finalY = 20; // Reset position on new page
        }
        
        doc.setFontSize(12);
        doc.text("Mengetahui,", 140, finalY);
        doc.text("Kepala", 140, finalY + 8);
        doc.text("(___________________)", 140, finalY + 35);
    
        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(pdfUrl);
    };

    // Function Download PDF
    const downloadPDF = () => {
        if (pdfPreviewUrl) {
            const link = document.createElement("a");
            link.href = pdfPreviewUrl;
            link.download = `Laporan_Absensi_${selectedDate}.pdf`;
            link.click();
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
        }
    };

    return (
        <div className="container mx-auto py-6 max-w-full">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Attendance Records</h1>

            {/* Filter Date & Print Button */}
            <div className="flex justify-between mb-4 gap-4">
                <div className="flex flex-col md:flex-row md:gap-2 gap-1 ">
                    <label className="flex font-semibold text-gray-700 items-center">Filter by Date: </label>

                    {/* Calendar Icon & Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(new Date(selectedDate), "yyyy-MM-dd")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={new Date(selectedDate)}
                                onSelect={(date) => date && setSelectedDate(date.toLocaleDateString("sv-SE"))}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Print Button */}

                <div className="flex items-end">
                    <button
                        onClick={generatePDF}
                        className="flex bg-blue-600 text-white px-1 py-1.5 md:py-2 rounded-md hover:bg-blue-700 transition text-sm md:text-base"
                    >
                        🖨 Print Preview
                    </button>
                </div>
            </div>

            {/* Modal Preview PDF */}
            {pdfPreviewUrl && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                    <div ref={modalRef} className="bg-white p-4 rounded-lg shadow-lg w-11/12 max-w-3xl relative">
                        <h2 className="text-lg font-semibold mb-2">Preview PDF</h2>
                        <iframe src={pdfPreviewUrl} className="w-full h-[400px] border" />

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
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Waktu Masuk</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Status Masuk</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Waktu Keluar</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Status Keluar</th>
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
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.time_checkout || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.status_checkout || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 justify-center">
                                    {loadingImages ? (
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                <span className="ml-2 text-gray-500 text-sm">Memuat gambar...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Check-in Image */}
                                                {imageUrls[`${selectedDate}-${uid}`] ? (
                                                    <div className="relative">
                                                        <img
                                                            src={imageUrls[`${selectedDate}-${uid}`]}
                                                            alt="Gambar Masuk"
                                                            className="h-[30px] w-[40px] md:h-[80px] md:w-[100px] object-cover cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => setSelectedImage(imageUrls[`${selectedDate}-${uid}`])}
                                                        />
                                                        <span className="absolute top-0 left-0 bg-green-600 text-white text-xs px-1 py-0.5 rounded-br">In</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-center">- In -</span>
                                                )}

                                                {/* Check-out Image */}
                                                {checkoutImageUrls[`${selectedDate}-${uid}`] ? (
                                                    <div className="relative">
                                                        <img
                                                            src={checkoutImageUrls[`${selectedDate}-${uid}`]}
                                                            alt="Gambar Keluar"
                                                            className="h-[30px] w-[40px] md:h-[80px] md:w-[100px] object-cover cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => setSelectedImage(checkoutImageUrls[`${selectedDate}-${uid}`])}
                                                        />
                                                        <span className="absolute top-0 left-0 bg-red-600 text-white text-xs px-1 py-0.5 rounded-br">Out</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-center">- Out -</span>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-4 text-gray-600">
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