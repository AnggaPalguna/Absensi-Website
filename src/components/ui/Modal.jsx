"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, message, type }) => {
  if (!isOpen) return null;

  const messageStyles =
    type === "success"
      ? "text-green-700 bg-green-100 border-green-500"
      : "text-red-700 bg-red-100 border-red-500";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white p-6 rounded-lg shadow-lg w-72 md:w-96 border ${messageStyles}`}>
        {/* Tombol Close (X) di pojok kanan atas */}
        <button onClick={onClose} className=" text-gray-400 hover:text-gray-600 float-right">
          <X size={20} />
        </button>

        <p className="mt-8 mb-6">{message}</p>

        {/* <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 w-full"
        >
          Close
        </button> */}
      </div>
    </div>
  );
};

export default Modal;
