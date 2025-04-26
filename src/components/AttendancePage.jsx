"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue, update, set, remove, push } from "firebase/database";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { database } from "../../firebase-config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isWithinInterval, isSunday, parse, isEqual } from "date-fns";
import { CalendarIcon, Calendar as CalendarRange, FileDown, Search, X, Edit, PlusCircle, Trash2 } from "lucide-react";
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "../hooks/use-toast";

export default function AttendanceTable() {
    const [attendance, setAttendance] = useState({});
    const [filterMode, setFilterMode] = useState("single"); // "single" or "range"
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("sv-SE"));
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loadingImageId, setLoadingImageId] = useState(null);
    const [imageCache, setImageCache] = useState({}); // Cache for loaded images
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const storage = getStorage();
    
    // New state for editing absence details
    const [isEditingAbsence, setIsEditingAbsence] = useState(false);
    const [absentDetails, setAbsentDetails] = useState("");
    const [currentEditRecord, setCurrentEditRecord] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // New state for holidays
    const [holidays, setHolidays] = useState([]);
    const [isAddingHoliday, setIsAddingHoliday] = useState(false);
    const [holidayName, setHolidayName] = useState("");
    const [holidayDate, setHolidayDate] = useState(new Date());
    const [isManagingHolidays, setIsManagingHolidays] = useState(false);

    useEffect(() => {
        const attendanceRef = ref(database, "attendance");
        onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val() || {};
            setAttendance(data);
            setAvailableDates(Object.keys(data));
            setIsLoading(false);
        });

        // Fetch holidays from Firebase
        const holidaysRef = ref(database, "holidays");
        onValue(holidaysRef, (snapshot) => {
            const data = snapshot.val() || {};
            const holidaysList = Object.entries(data).map(([id, holiday]) => ({
                id,
                ...holiday,
                date: new Date(holiday.date) // Convert string date to Date object
            }));
            setHolidays(holidaysList);
        });
    }, []);

    // Function to check if a date is a holiday
    const isHoliday = (dateToCheck) => {
        const checkDate = new Date(dateToCheck);
        return holidays.some(holiday => 
            isEqual(
                new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()),
                new Date(holiday.date.getFullYear(), holiday.date.getMonth(), holiday.date.getDate())
            )
        );
    };

    // Function to get holiday name if it's a holiday
    const getHolidayName = (dateToCheck) => {
        const checkDate = new Date(dateToCheck);
        const holiday = holidays.find(holiday => 
            isEqual(
                new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()),
                new Date(holiday.date.getFullYear(), holiday.date.getMonth(), holiday.date.getDate())
            )
        );
        return holiday ? holiday.name : null;
    };

    // Function to add a new holiday
    const addHoliday = async () => {
        if (!holidayName.trim() || !holidayDate) {
            toast({
                title: "Input tidak valid",
                description: "Nama dan tanggal hari libur harus diisi",
                variant: "destructive"
            });
            return;
        }

        setIsUpdating(true);
        
        try {
            const holidaysRef = ref(database, "holidays");
            const newHolidayRef = push(holidaysRef);
            
            await set(newHolidayRef, {
                name: holidayName.trim(),
                date: format(holidayDate, "yyyy-MM-dd")
            });
            
            // Show success notification
            toast({
                title: "Hari Libur ditambahkan",
                description: `${holidayName} telah ditambahkan sebagai hari libur`,
                variant: "success"
            });
            
            // Reset form
            setHolidayName("");
            setHolidayDate(new Date());
            setIsAddingHoliday(false);
        } catch (error) {
            console.error("Error adding holiday:", error);
            
            toast({
                title: "Gagal menambahkan hari libur",
                description: "Terjadi kesalahan saat menyimpan data",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Function to delete a holiday
    const deleteHoliday = async (holidayId) => {
        if (!holidayId) return;
        
        if (!confirm("Apakah Anda yakin ingin menghapus hari libur ini?")) {
            return;
        }
        
        try {
            const holidayRef = ref(database, `holidays/${holidayId}`);
            await remove(holidayRef);
            
            toast({
                title: "Hari Libur dihapus",
                description: "Hari libur telah dihapus dari daftar",
                variant: "success"
            });
        } catch (error) {
            console.error("Error deleting holiday:", error);
            
            toast({
                title: "Gagal menghapus hari libur",
                description: "Terjadi kesalahan saat menghapus data",
                variant: "destructive"
            });
        }
    };

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
        
        // Apply search filter if query exists
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            allRecords = allRecords.filter(record => 
                (record.name && record.name.toLowerCase().includes(query)) ||
                (record.position && record.position.toLowerCase().includes(query)) ||
                (record.status && record.status.toLowerCase().includes(query)) ||
                (record.absence_details && record.absence_details.toLowerCase().includes(query))
            );
        }
        
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
        let title = "Laporan Absensi LPD Desa Adat Tengkulak Kelod";
        let subtitle;
        
        if (filterMode === "single") {
            subtitle = `Tanggal ${formatDisplayDate(selectedDate)}`;
        } else {
            const fromDate = formatDisplayDate(dateRange.from);
            const toDate = formatDisplayDate(dateRange.to);
            subtitle = `Tanggal ${fromDate} s/d ${toDate}`;
        }
        
        // Add header
        const logoUrl = "/img/logo.png";
        doc.addImage(logoUrl, "PNG", 15, 15, 15, 15);
        
        doc.setFontSize(16);
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
            const isHolidayDate = isHoliday(date);
            const holidayName = getHolidayName(date);
            const formattedDate = formatDisplayDate(date);
            
            // Add date header row
            let dateHeader = `Tanggal: ${formattedDate}`;
            if (isHolidayDate) {
                dateHeader += ` (Libur: ${holidayName})`;
            } else if (isSundayDate) {
                dateHeader += " (Minggu)";
            }
            
            tableData.push([
                {
                    content: dateHeader,
                    colSpan: 8,
                    styles: {
                        fillColor: isSundayDate || isHolidayDate ? [255, 200, 200] : [220, 220, 220],
                        textColor: isSundayDate || isHolidayDate ? [200, 0, 0] : [0, 0, 0],
                        fontStyle: 'bold',
                        halign: 'center'
                    }
                }
            ]);
            
            // Skip data rows if it's Sunday or Holiday
            if (isSundayDate || isHolidayDate) {
                return;
            }
            
            // Add data rows
            if (attendance[date]) {
                Object.entries(attendance[date]).forEach(([uid, record], index) => {
                    const row = [
                        index + 1,
                        record.name || "-",
                        record.position || "-",
                        record.time || "-",
                        record.status || "-",
                        record.time_checkout || "-",
                        record.status_checkout || "-",
                    ];
                    
                    // Add absence details if available
                    if (record.status === "Tidak Hadir" && record.absence_details) {
                        row.push(record.absence_details);
                    } else {
                        row.push("-");
                    }
                    
                    tableData.push(row);
                });
            } else {
                tableData.push([
                    {
                        content: "Tidak ada data absensi",
                        colSpan: 8,
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
            head: [["No", "Nama", "Jabatan", "Waktu Masuk", "Status Masuk", "Waktu Keluar", "Status Keluar", "Keterangan"]],
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
        doc.text("Ketua", 140, finalY + 8);
        doc.text("( I Kadek Suardana )", 140, finalY + 35);
        
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
            return `Laporan_Absensi_LPD_${fromDateStr}_sd_${toDateStr}.pdf`;
        }
    };

    // Function to check if an image is currently loading
    const isImageLoading = (record, type) => {
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

    // Clear search function
    const clearSearch = () => {
        setSearchQuery("");
    };

    // Open absence details dialog
    const openAbsenceDetailsDialog = (record) => {
        setCurrentEditRecord(record);
        setAbsentDetails(record.absence_details || "");
        setIsEditingAbsence(true);
    };

    // Close absence details dialog
    const closeAbsenceDetailsDialog = () => {
        setIsEditingAbsence(false);
        setCurrentEditRecord(null);
        setAbsentDetails("");
    };

    // Update absence details in Firebase
    const updateAbsenceDetails = async () => {
        if (!currentEditRecord) return;
        
        setIsUpdating(true);
        
        try {
            const recordRef = ref(database, `attendance/${currentEditRecord.date}/${currentEditRecord.uid}`);
            
            await update(recordRef, {
                absence_details: absentDetails
            });
            
            // Show success notification
            toast({
                title: "Data berhasil diperbarui",
                description: "Keterangan ketidakhadiran berhasil disimpan",
                variant: "success"
            });
            
            closeAbsenceDetailsDialog();
        } catch (error) {
            console.error("Error updating absence details:", error);
            
            // Show error notification
            toast({
                title: "Gagal memperbarui data",
                description: "Terjadi kesalahan saat menyimpan keterangan",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Format date to locale string
    const formatDate = (date) => {
        return format(new Date(date), "dd MMMM yyyy");
    };

    return (
        <div className="mx-auto py-6 px-4">
            {/* Page Header */}
            <div className="mb-10">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Catatan Absensi</h1>
                <p className="text-gray-600 text-sm md:text-base">Sistem pencatatan kehadiran karyawan</p>
            </div>

            {/* Control Panel */}
            <div className="bg-white rounded-lg shadow-md mb-6 p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Filter Date Controls */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-gray-800">Filter Data</h2>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center">
                                <label className="w-24 text-sm text-gray-600">Mode Filter:</label>
                                <select
                                    value={filterMode}
                                    onChange={(e) => setFilterMode(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-md text-sm p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="single">Tanggal Tunggal</option>
                                    <option value="range">Rentang Tanggal</option>
                                </select>
                            </div>

                            {/* Date Picker Based on Mode */}
                            <div className="flex items-center">
                                <label className="w-24 text-sm text-gray-600">Tanggal:</label>
                                {filterMode === "single" ? (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full flex-1 justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(new Date(selectedDate), "dd MMMM yyyy")}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={new Date(selectedDate)}
                                                onSelect={handleDateChange}
                                                initialFocus
                                                modifiers={{
                                                    holiday: (date) => 
                                                        holidays.some(holiday => 
                                                            isEqual(
                                                                new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                                                                new Date(holiday.date.getFullYear(), holiday.date.getMonth(), holiday.date.getDate())
                                                            )
                                                        )
                                                }}
                                                modifiersStyles={{
                                                    holiday: { color: 'red', fontWeight: 'bold' }
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full flex-1 justify-start text-left font-normal">
                                                <CalendarRange className="mr-2 h-4 w-4" />
                                                {dateRange.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "dd MMMM yyyy")
                                                    )
                                                ) : (
                                                    <span>Pilih rentang tanggal</span>
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
                                                modifiers={{
                                                    holiday: (date) => 
                                                        holidays.some(holiday => 
                                                            isEqual(
                                                                new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                                                                new Date(holiday.date.getFullYear(), holiday.date.getMonth(), holiday.date.getDate())
                                                            )
                                                        )
                                                }}
                                                modifiersStyles={{
                                                    holiday: { color: 'red', fontWeight: 'bold' }
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Search Box */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-gray-800">Pencarian</h2>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama, jabatan, status, keterangan..."
                                className="w-full border border-gray-300 rounded-md text-sm p-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            {searchQuery && (
                                <button 
                                    onClick={clearSearch}
                                    className="absolute right-3 top-2.5"
                                >
                                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-gray-800">Aksi</h2>
                        <div className="flex flex-col space-y-2">
                            <Button
                                onClick={printPDF}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={(filterMode === "range" && (!dateRange.from || !dateRange.to))}
                            >
                                <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
                            </Button>
                            <Button
                                onClick={() => setIsManagingHolidays(true)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" /> Kelola Hari Libur
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            {isLoading ? (
                <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-600">Memuat data absensi...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-blue-500 text-white">
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base">No</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base">Nama</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base">Tanggal</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base hidden md:table-cell">Jabatan</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base">Masuk</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base hidden md:table-cell">Status</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base">Keluar</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base hidden md:table-cell">Status</th>
                                    <th className="py-3 px-4 text-left font-semibold text-xs md:text-sm lg:text-base hidden md:table-cell">Keterangan</th>
                                    <th className="py-3 px-4 text-center font-semibold text-xs md:text-sm lg:text-base">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {getFilteredAttendanceData().length > 0 ? (
                                    getFilteredAttendanceData().map((record, index) => {
                                        const recordDate = new Date(record.date);
                                        const isSundayDate = isSunday(recordDate);
                                        const isHolidayDate = isHoliday(record.date);
                                        
                                        // Highlight row if it's a Sunday or holiday
                                        const rowClass = isSundayDate || isHolidayDate 
                                            ? "bg-red-50 hover:bg-red-100 transition-colors"
                                            : "hover:bg-gray-50 transition-colors";
                                            
                                        return (
                                            <tr key={`${record.date}-${record.uid}`} className={rowClass}>
                                                <td className="py-3 px-4 text-sm text-gray-700">{index + 1}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700 font-medium">{record.name || '-'}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700">
                                                    <div className="flex flex-col">
                                                        <span>{format(recordDate, "dd/MM/yyyy")}</span>
                                                        {isHolidayDate && (
                                                            <span className="text-xs text-red-600 font-medium">
                                                                {getHolidayName(record.date)}
                                                            </span>
                                                        )}
                                                        {isSundayDate && !isHolidayDate && (
                                                            <span className="text-xs text-red-600 font-medium">
                                                                Minggu
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-700 hidden md:table-cell">{record.position || '-'}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700">
                                                    <div className="flex flex-col">
                                                        <span>{record.time || '-'}</span>
                                                        <span className="text-xs text-gray-500 md:hidden">{record.status || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm hidden md:table-cell">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        record.status === 'Lebih Awal' ? 'bg-purple-100 text-purple-800' : 
                                                        record.status === 'Tepat Waktu' ? 'bg-green-100 text-green-800' : 
                                                        record.status === 'Terlambat' ? 'bg-yellow-100 text-yellow-800' :
                                                        record.status === 'Tidak Hadir' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {record.status || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-700">
                                                    <div className="flex flex-col">
                                                        <span>{record.time_checkout || '-'}</span>
                                                        <span className="text-xs text-gray-500 md:hidden">{record.status_checkout || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm hidden md:table-cell">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        record.status_checkout === 'Tepat Waktu' ? 'bg-green-100 text-green-800' : 
                                                        record.status_checkout === 'Pulang Awal' ? 'bg-red-100 text-red-400' : 
                                                        record.status_checkout === 'Tidak Hadir' ? 'bg-red-100 text-red-800' : 
                                                        record.status_checkout === 'Tidak Absen' ? 'bg-red-100 text-red-800' : 
                                                        'bg-gray-100 text-gray-800'
                                                        
                                                    }`}>
                                                        {record.status_checkout || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-700 hidden md:table-cell">
                                                <div className="max-w-xs overflow-hidden text-ellipsis">
                                                {(record.status === "Tidak Hadir" || record.status_checkout === "Tidak Hadir" || record.status_checkout === "Tidak Absen") ? (
                                                    record.status_checkout === "Tidak Absen"
                                                    ? (record.absence_details || "Lupa absen keluar")
                                                    : (record.absence_details || "Belum ada keterangan")
                                                ) : "-"}
                                                </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2 justify-center">
                                                        {/* Check-in Image */}
                                                        {record.imageUrl ? (
                                                            isImageCached(record, 'in') ? (
                                                                <div className="relative group">
                                                                    <img 
                                                                        src={getCachedImage(record, 'in')} 
                                                                        alt="Gambar Masuk"
                                                                        className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-md cursor-pointer group-hover:opacity-75 transition-opacity"
                                                                        onClick={() => setSelectedImage(getCachedImage(record, 'in'))}
                                                                    />
                                                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                                        I
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="h-10 w-10 md:h-12 md:w-12 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors relative"
                                                                    onClick={() => loadImage(record, 'in')}
                                                                    disabled={isImageLoading(record, 'in')}
                                                                >
                                                                    {isImageLoading(record, 'in') ? (
                                                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                                                    ) : (
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-blue-600 text-xs">IN</span>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            )
                                                        ) : null}

                                                        {/* Check-out Image */}
                                                        {record.image_checkout ? (
                                                            isImageCached(record, 'out') ? (
                                                                <div className="relative group">
                                                                    <img 
                                                                        src={getCachedImage(record, 'out')} 
                                                                        alt="Gambar Keluar"
                                                                        className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-md cursor-pointer group-hover:opacity-75 transition-opacity"
                                                                        onClick={() => setSelectedImage(getCachedImage(record, 'out'))}
                                                                    />
                                                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                                        O
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="h-10 w-10 md:h-12 md:w-12 bg-red-50 border border-red-200 rounded-md flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors relative"
                                                                    onClick={() => loadImage(record, 'out')}
                                                                    disabled={isImageLoading(record, 'out')}
                                                                >
                                                                    {isImageLoading(record, 'out') ? (
                                                                        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                                                                    ) : (
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-red-600 text-xs">OUT</span>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            )
                                                        ) : null}

                                                        {/* Edit Absence Details Button - only for "Tidak Hadir" status */}
                                                        <button
                                                            className={`h-10 w-10 md:h-12 md:w-12 border rounded-md flex items-center justify-center transition-colors
                                                                ${record.status === "Tidak Hadir" || record.status_checkout === "Tidak Hadir" || record.status_checkout === "Tidak Absen"
                                                                ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 cursor-pointer"
                                                                : "bg-gray-100 border-gray-200 cursor-not-allowed"
                                                                }`}
                                                            onClick={() => {
                                                                if (record.status === "Tidak Hadir" || record.status_checkout === "Tidak Hadir"|| record.status_checkout === "Tidak Absen") {
                                                                openAbsenceDetailsDialog(record);
                                                                }
                                                            }}
                                                            title={
                                                                record.status === "Tidak Hadir" || record.status_checkout === "Tidak Hadir" || record.status_checkout === "Tidak Absen"
                                                                ? "Edit keterangan ketidakhadiran"
                                                                : "Tidak dapat diedit"
                                                            }
                                                            >
                                                            <Edit
                                                                className={`w-5 h-5 ${
                                                                record.status === "Tidak Hadir" || record.status_checkout === "Tidak Hadir" || record.status_checkout === "Tidak Absen"
                                                                    ? "text-yellow-600"
                                                                    : "text-gray-400"
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="text-center py-8 text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {searchQuery ? (
                                                    <p>Tidak ada data yang cocok dengan pencarian "{searchQuery}"</p>
                                                ) : (
                                                    <p>
                                                        {filterMode === "single" 
                                                            ? `Tidak ada data pada tanggal ${format(new Date(selectedDate), "dd MMMM yyyy")}`
                                                            : `Tidak ada data pada rentang tanggal yang dipilih`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Modal Pop-up for Image Preview */}
            {selectedImage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4">
                    <div className="bg-white rounded-lg overflow-hidden relative max-w-sm max-h-[80vh]">
                        <div className="sticky top-0 z-10 flex justify-between items-center bg-gray-100 p-3">
                            <h3 className="font-medium text-gray-800">Preview Foto Absensi</h3>
                            <button
                                className="rounded-full p-1 hover:bg-gray-200 transition-colors"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-2">
                            <img 
                                src={selectedImage} 
                                alt="Preview" 
                                className="max-w-full max-h-[70vh] object-contain" 
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {/* Dialog for Editing Absence Details */}
            <Dialog open={isEditingAbsence} onOpenChange={(open) => !open && closeAbsenceDetailsDialog()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Keterangan Ketidakhadiran</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        {currentEditRecord && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Nama</p>
                                    <p className="font-medium">{currentEditRecord.name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Tanggal</p>
                                    <p className="font-medium">{format(new Date(currentEditRecord.date), "dd MMMM yyyy")}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Jabatan</p>
                                    <p className="font-medium">{currentEditRecord.position || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Status</p>
                                    <p className="font-medium text-red-600">Tidak Hadir</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label htmlFor="absence_details" className="text-sm font-medium text-gray-700">
                                Keterangan Ketidakhadiran
                            </label>
                            <Textarea
                                id="absence_details"
                                placeholder="Masukkan keterangan ketidakhadiran di sini..."
                                value={absentDetails}
                                onChange={(e) => setAbsentDetails(e.target.value)}
                                rows={4}
                                className="w-full resize-none border-gray-300 rounded-md text-sm"
                            />
                            <p className="text-xs text-gray-500">
                                Contoh: Sakit dengan surat dokter, Izin karena urusan keluarga, dll.
                            </p>
                        </div>
                    </div>
                    
                    <DialogFooter className="flex space-x-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeAbsenceDetailsDialog}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={updateAbsenceDetails}
                            disabled={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Keterangan"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Holiday Management Dialog */}
            <Dialog open={isManagingHolidays} onOpenChange={(open) => !open && setIsManagingHolidays(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kelola Hari Libur</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Daftar Hari Libur</h3>
                            <Button
                                size="sm"
                                onClick={() => setIsAddingHoliday(true)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Tambah
                            </Button>
                        </div>
                        
                        {holidays.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                            <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {holidays.sort((a, b) => a.date - b.date).map((holiday) => (
                                            <tr key={holiday.id}>
                                                <td className="py-2 px-3 text-sm text-gray-700">
                                                    {formatDate(holiday.date)}
                                                </td>
                                                <td className="py-2 px-3 text-sm text-gray-700">
                                                    {holiday.name}
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <button
                                                        onClick={() => deleteHoliday(holiday.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Belum ada data hari libur</p>
                                <p className="text-sm">Tambahkan hari libur dengan mengklik tombol Tambah di atas</p>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button
                            onClick={() => setIsManagingHolidays(false)}
                            variant="outline"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Add Holiday Dialog */}
            <Dialog open={isAddingHoliday} onOpenChange={(open) => !open && setIsAddingHoliday(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Hari Libur</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="holiday_name" className="text-sm font-medium text-gray-700">
                                Nama Hari Libur
                            </label>
                            <Input
                                id="holiday_name"
                                value={holidayName}
                                onChange={(e) => setHolidayName(e.target.value)}
                                placeholder="Contoh: Hari Raya Nyepi, Hari Kemerdekaan, dll."
                                className="w-full"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Tanggal
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {holidayDate ? format(holidayDate, "dd MMMM yyyy") : "Pilih tanggal"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={holidayDate}
                                        onSelect={(date) => date && setHolidayDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    
                    <DialogFooter className="flex space-x-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddingHoliday(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={addHoliday}
                            disabled={isUpdating || !holidayName.trim() || !holidayDate}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}