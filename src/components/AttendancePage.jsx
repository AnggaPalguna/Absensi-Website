"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { database } from "../../firebase-config";

export default function AttendanceTable() {
    const [attendance, setAttendance] = useState({});
    const [imageUrls, setImageUrls] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const storage = getStorage();

    useEffect(() => {
        const attendanceRef = ref(database, "attendance");
        onValue(attendanceRef, async (snapshot) => {
            const data = snapshot.val() || {};
            setAttendance(data);

            let urls = {};
            for (const dates in data) {
                for (const uid in data[dates]) {
                    const imgName = data[dates][uid].imageUrl;
                    if (imgName) {
                        try {
                            const imageRef = storageRef(storage, `${imgName}`);
                            const url = await getDownloadURL(imageRef);
                            urls[`${dates}-${uid}`] = url;
                        } catch (error) {
                            console.error("Error fetching image URL", error);
                        }
                    }
                }
            }
            setImageUrls(urls);
        });
    }, []);

    return (
        <div className="container mx-auto py-6 max-w-full">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Attendance Records</h1>
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
                        {Object.entries(attendance).flatMap(([dates, uid], index) =>
                            Object.entries(uid).map(([uid, record], subIndex) => (
                                <tr key={`${dates}-${uid}`} className="border-b border-gray-300 text-xs md:text-base hover:bg-gray-100 transition text-slate-800">
                                    <td className="border border-gray-300 py-2 text-center ">{index + subIndex + 1}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.name || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{dates}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.time || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">{record.status || '-'}</td>
                                    <td className="border border-gray-300 px-2 md:px-4 py-2">
                                        {imageUrls[`${dates}-${uid}`] ? (
                                            <img
                                                src={imageUrls[`${dates}-${uid}`]}
                                                alt="Gambar"
                                                className="h-[30px] w-[40px] md:h-[100px] md:w-[120px] object-cover cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => setSelectedImage(imageUrls[`${dates}-${uid}`])}
                                            />
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
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