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
import { format, isWithinInterval, isSunday, parse } from "date-fns";
import { CalendarIcon, Calendar as CalendarRange } from "lucide-react";
import { Loader2 } from 'lucide-react';

export default function AttendanceTable() {
    const [attendance, setAttendance] = useState({});
    const [filterMode, setFilterMode] = useState("single"); // "single" or "range"
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("sv-SE"));
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loadingImageId, setLoadingImageId] = useState(null);
    const [imageCache, setImageCache] = useState({}); // Cache for loaded images
    const storage = getStorage();

    useEffect(() => {
        const attendanceRef = ref(database, "attendance");
        onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val() || {};
            setAttendance(data);
            setAvailableDates(Object.keys(data));
        });
    }, []);

    // Function to format date for display
    const formatDisplayDate = (date) => {
        return new Date(date).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    };

    // Function to check if a date is within the selected range
    const isDateInRange = (date) => {
        if (filterMode === "single") return date === selectedDate;
        
        if (!dateRange.from || !dateRange.to) return false;
        
        const checkDate = new Date(date);
        return isWithinInterval(checkDate, {
            start: new Date(dateRange.from),
            end: new Date(dateRange.to)
        });
    };

    // Function to get all dates in the range
    const getDatesInRange = () => {
        if (filterMode === "single") return [selectedDate];
        
        if (!dateRange.from || !dateRange.to) return [];
        
        const dates = [];
        let currentDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        
        while (currentDate <= endDate) {
            const formattedDate = format(currentDate, "yyyy-MM-dd");
            if (attendance[formattedDate]) {
                dates.push(formattedDate);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    };

    // Function to handle date or range selection
    const handleDateChange = (date) => {
        if (date) {
            setSelectedDate(format(date, "yyyy-MM-dd"));
            // Reset date range if in single mode
            if (filterMode === "single") {
                setDateRange({ from: null, to: null });
            }
        }
    };

    // Function to handle date range selection
    const handleDateRangeChange = (range) => {
        setDateRange({
            from: range?.from || null,
            to: range?.to || null
        });
        // Reset selected date if in range mode
        if (filterMode === "range" && range?.from) {
            setSelectedDate(format(range.from, "yyyy-MM-dd"));
        }
    };

    // Function to get all filtered attendance data
    const getFilteredAttendanceData = () => {
        const filteredDates = getDatesInRange();
        let allRecords = [];
        
        filteredDates.forEach(date => {
            if (attendance[date]) {
                Object.entries(attendance[date]).forEach(([uid, record]) => {
                    allRecords.push({
                        date,
                        uid,
                        ...record
                    });
                });
            }
        });
        
        return allRecords;
    };

    // Function to load image on demand
    const loadImage = async (record, type) => {
        const imageId = `${record.date}-${record.uid}-${type}`;
        
        // If already loading this image or already in cache, return
        if (loadingImageId === imageId || imageCache[imageId]) {
            if (imageCache[imageId]) {
                setSelectedImage(imageCache[imageId]);
            }
            return;
        }
        
        setLoadingImageId(imageId);
        
        try {
            const imgPath = type === 'in' ? record.imageUrl : record.image_checkout;
            
            if (!imgPath) {
                setLoadingImageId(null);
                return;
            }
            
            const imageRef = storageRef(storage, imgPath);
            const url = await getDownloadURL(imageRef);
            
            // Update image cache
            setImageCache(prev => ({
                ...prev,
                [imageId]: url
            }));
            
            // Set as selected image for viewing
            setSelectedImage(url);
        } catch (error) {
            console.log(`Error fetching ${type} image:`, error);
        } finally {
            setLoadingImageId(null);
        }
    };

    // Function Generate PDF
    const printPDF = () => {
        const doc = new jsPDF();
        const filteredDates = getDatesInRange();
        
        // Set document title based on filter mode
        let title = "Laporan Absensi";
        let subtitle;
        
        if (filterMode === "single") {
            subtitle = `Tanggal ${formatDisplayDate(selectedDate)}`;
        } else {
            const fromDate = formatDisplayDate(dateRange.from);
            const toDate = formatDisplayDate(dateRange.to);
            subtitle = `Tanggal ${fromDate} s/d ${toDate}`;
        }
        
        // Add header
        const logoUrl = "https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
        doc.addImage(logoUrl, "PNG", 15, 15, 15, 15);
        
        doc.setFontSize(18);
        doc.text(title, 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text(subtitle, 105, 30, null, null, "center");
        
        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);
        
        let startY = 40;
        let tableData = [];
        
        // Generate table data based on dates
        filteredDates.forEach(date => {
            const dateObj = new Date(date);
            const isSundayDate = isSunday(dateObj);
            const formattedDate = formatDisplayDate(date);
            
            // Add date header row
            tableData.push([
                {
                    content: `Tanggal: ${formattedDate}`,
                    colSpan: 8,
                    styles: {
                        fillColor: isSundayDate ? [255, 200, 200] : [220, 220, 220],
                        textColor: isSundayDate ? [200, 0, 0] : [0, 0, 0],
                        fontStyle: 'bold',
                        halign: 'center'
                    }
                }
            ]);
            
            // Skip data rows if it's Sunday
            if (isSundayDate) {
                return;
            }
            
            // Add data rows
            if (attendance[date]) {
                Object.entries(attendance[date]).forEach(([uid, record], index) => {
                    tableData.push([
                        index + 1,
                        record.name || "-",
                        record.position || "-",
                        record.time || "-",
                        record.status || "-",
                        record.time_checkout || "-",
                        record.status_checkout || "-", // Placeholder for image column
                    ]);
                });
            } else {
                tableData.push([
                    {
                        content: "Tidak ada data absensi",
                        colSpan: 7,
                        styles: { halign: 'center' }
                    }
                ]);
            }
        });
        
        // Generate table
        autoTable(doc, {
            startY: startY,
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
            styles: { fontSize: 10, cellPadding: 3 },
            head: [["No", "Nama","Jabatan", "Waktu Masuk", "Status Masuk", "Waktu Keluar", "Status Keluar"]],
            body: tableData,
        });
        
        let finalY = doc.lastAutoTable.finalY + 20;
        
        // Check if signature exceeds page boundary
        if (finalY + 40 > doc.internal.pageSize.height) {
            doc.addPage();
            finalY = 20; // Reset position on new page
        }
        
        // Add signature
        doc.setFontSize(12);
        doc.text("Mengetahui,", 140, finalY);
        doc.text("Kepala", 140, finalY + 8);
        doc.text("(___________________)", 140, finalY + 35);
        
        // Save or print the PDF
        const pdfFilename = getPdfFilename();
        doc.save(pdfFilename);
    };

    // Function to generate PDF filename
    const getPdfFilename = () => {
        if (filterMode === "single") {
            return `Laporan_Absensi_${selectedDate}.pdf`;
        } else {
            const fromDateStr = format(dateRange.from, "yyyyMMdd");
            const toDateStr = format(dateRange.to, "yyyyMMdd");
            return `Laporan_Absensi_${fromDateStr}_sd_${toDateStr}.pdf`;
        }
    };

    // Function to check if an image is currently loading
    const isLoading = (record, type) => {
        const imageId = `${record.date}-${record.uid}-${type}`;
        return loadingImageId === imageId;
    };

    // Function to check if an image has been loaded and cached
    const isImageCached = (record, type) => {
        const imageId = `${record.date}-${record.uid}-${type}`;
        return !!imageCache[imageId];
    };

    // Function to get image from cache
    const getCachedImage = (record, type) => {
        const imageId = `${record.date}-${record.uid}-${type}`;
        return imageCache[imageId];
    };

    return (
        <div className="container mx-auto py-6 max-w-full">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Catatan Absensi</h1>

            {/* Filter Date & Print Button */}
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                <div className="flex flex-row items-center md:gap-2 gap-1">
                    <label className="flex font-semibold text-gray-700 items-center">Filter: </label>

                    {/* Filter Mode Selection */}
                    <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        className="border border-gray-300 rounded-md text-sm px-2 py-1 mr-2"
                    >
                        <option value="single">Single Date</option>
                        <option value="range">Date Range</option>
                    </select>

                    {/* Single Date Picker */}
                    {filterMode === "single" && (
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
                                    onSelect={handleDateChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Date Range Picker */}
                    {filterMode === "range" && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal text-sm">
                                    <CalendarRange className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            <div className="text-xs">
                                                {format(dateRange.from, "yyyy-MM-dd")} - {format(dateRange.to, "yyyy-MM-dd")}
                                            </div>
                                        ) : (
                                            format(dateRange.from, "yyyy-MM-dd")
                                        )
                                    ) : (
                                        <span>Select range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-auto p-0">
                                <Calendar
                                    mode="range"
                                    selected={{
                                        from: dateRange.from,
                                        to: dateRange.to
                                    }}
                                    onSelect={handleDateRangeChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                {/* Print Button */}
                <Button
                    onClick={printPDF}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={(filterMode === "range" && (!dateRange.from || !dateRange.to))}
                >
                    🖨 Print PDF
                </Button>
            </div>

            {/* Tabel Data */}
            <div className="overflow-x-auto">
                <table className="w-full border border-gray-400 shadow-md">
                    <thead>
                        <tr className="bg-gray-300 text-gray-800 text-xs md:text-base">
                            <th className="border border-gray-400 py-2">No</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Nama</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Tanggal</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Jabatan</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Waktu Masuk</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Status Masuk</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Waktu Keluar</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Status Keluar</th>
                            <th className="border border-gray-400 px-2 md:px-4 py-2">Gambar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredAttendanceData().length > 0 ? (
                            getFilteredAttendanceData().map((record, index) => (
                                <tr key={`${record.date}-${record.uid}`} className="border-b border-gray-300 text-xs md:text-base hover:bg-gray-100 transition text-slate-800">
                                    <td className="border border-gray-300 py-2 text-center">{index + 1}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.name || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.date}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.position || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.time || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.status || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.time_checkout || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.status_checkout || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 justify-center">
                                        {/* Check-in Image Button */}
                                        <div className="relative">
                                            {record.imageUrl ? (
                                                isImageCached(record, 'in') ? (
                                                    // Show cached image thumbnail
                                                    <div className="relative">
                                                        <img 
                                                            src={getCachedImage(record, 'in')} 
                                                            alt="Gambar Masuk"
                                                            className="h-[30px] w-[40px] md:h-[80px] md:w-[100px] object-cover cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => setSelectedImage(getCachedImage(record, 'in'))}
                                                        />
                                                        <span className="absolute top-0 left-0 bg-green-600 text-white text-xs px-1 py-0.5 rounded-br">In</span>
                                                    </div>
                                                ) : (
                                                    // Show button to load image
                                                    <button
                                                        className="h-[30px] w-[40px] md:h-[80px] md:w-[100px] bg-gray-100 border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                                        onClick={() => loadImage(record, 'in')}
                                                        disabled={isLoading(record, 'in')}
                                                    >
                                                        {isLoading(record, 'in') ? (
                                                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                        ) : (
                                                            <>
                                                                <span className="text-gray-600 text-xs md:text-sm">Lihat Foto</span>
                                                                <span className="absolute top-0 left-0 bg-green-600 text-white text-xs px-1 py-0.5 rounded-br">In</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-center">- In -</span>
                                            )}
                                        </div>

                                        {/* Check-out Image Button */}
                                        <div className="relative">
                                            {record.image_checkout ? (
                                                isImageCached(record, 'out') ? (
                                                    // Show cached image thumbnail
                                                    <div className="relative">
                                                        <img 
                                                            src={getCachedImage(record, 'out')} 
                                                            alt="Gambar Keluar"
                                                            className="h-[30px] w-[40px] md:h-[80px] md:w-[100px] object-cover cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => setSelectedImage(getCachedImage(record, 'out'))}
                                                        />
                                                        <span className="absolute top-0 left-0 bg-red-600 text-white text-xs px-1 py-0.5 rounded-br">Out</span>
                                                    </div>
                                                ) : (
                                                    // Show button to load image
                                                    <button
                                                        className="h-[30px] w-[40px] md:h-[80px] md:w-[100px] bg-gray-100 border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative"
                                                        onClick={() => loadImage(record, 'out')}
                                                        disabled={isLoading(record, 'out')}
                                                    >
                                                        {isLoading(record, 'out') ? (
                                                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                        ) : (
                                                            <>
                                                                <span className="text-gray-600 text-xs md:text-sm">Lihat Foto</span>
                                                                <span className="absolute top-0 left-0 bg-red-600 text-white text-xs px-1 py-0.5 rounded-br">Out</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-center">- Out -</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center py-4 text-gray-600">
                                    {filterMode === "single" 
                                        ? `Tidak ada data pada tanggal ${selectedDate}`
                                        : `Tidak ada data pada rentang tanggal yang dipilih`
                                    }
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Modal Pop-up for Image Preview */}
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