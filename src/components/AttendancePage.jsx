"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase-config";

export default function AttendanceTable() {
    const [attendance, setAttendance] = useState({});

    useEffect(() => {
        const attendanceRef = ref(database, "attendance");
        onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val();
            setAttendance(data || {});
        });
    }, []);

    return (
        <div className="container mx-auto py-6 max-w-full">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Attendance Records</h1>

            {/* Wrapper dengan overflow-x-auto untuk responsif */}
            <div className="overflow-x-auto">
                <table className="w-full border border-gray-400 shadow-md">
                    <thead>
                        <tr className="bg-gray-300 text-gray-800 text-xs md:text-base">
                            <th className="border border-gray-400 px-[3px] md:px-4 py-[3px] md:py-2">UID</th>
                            <th className="border border-gray-400 px-[3px] md:px-4 py-[3px] md:py-2">Date</th>
                            <th className="border border-gray-400 px-[3px] md:px-4 py-[3px] md:py-2">Check In Time</th>
                            <th className="border border-gray-400 px-[3px] md:px-4 py-[3px] md:py-2">Check In Status</th>
                            <th className="border border-gray-400 px-[3px] md:px-4 py-[3px] md:py-2">Check Out Time</th>
                            <th className="border border-gray-400 px-[3px] md:px-4 py-[3px] md:py-2">Check Out Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(attendance).map(([uid, dates]) =>
                            Object.entries(dates).map(([date, record]) => (
                                <tr key={`${uid}-${date}`} className="border-b border-gray-300 text-xs md:text-base hover:bg-gray-100 transition text-slate-800">
                                    <td className="border border-gray-300 px-[3px] md:px-4 py-[3px] md:py-2">{record.checkIn?.name || '-'}</td>
                                    <td className="border border-gray-300 px-[3px] md:px-4 py-[3px] md:py-2">{date}</td>
                                    <td className="border border-gray-300 px-[3px] md:px-4 py-[3px] md:py-2">{record.checkIn?.time || '-'}</td>
                                    <td className="border border-gray-300 px-[3px] md:px-4 py-[3px] md:py-2">{record.checkIn?.type || '-'}</td>
                                    <td className="border border-gray-300 px-[3px] md:px-4 py-[3px] md:py-2">{record.checkOut?.time || '-'}</td>
                                    <td className="border border-gray-300 px-[3px] md:px-4 py-[3px] md:py-2">{record.checkOut?.type || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );
}
