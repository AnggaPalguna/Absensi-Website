"use client";

import { useParams } from "next/navigation";
import EditEmployee from "@/components/EditEmployee";

export default function EditEmployeePage() {
  const { uid } = useParams(); // Ambil UID secara langsung
  return <EditEmployee uid={uid} />;
}