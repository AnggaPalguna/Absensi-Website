"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, get, remove } from "firebase/database";
import { Pencil, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      const employeesRef = ref(database, "employees");
      const snapshot = await get(employeesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const employeeList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setEmployees(employeeList);
      }
    };
    fetchEmployees();
  }, []);

  const handleDeleteConfirm = (id) => {
    setSelectedId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (selectedId) {
      await remove(ref(database, `employees/${selectedId}`));
      setEmployees(employees.filter((employee) => employee.id !== selectedId));
      setOpen(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-700">Employee List</h1>
      <div className="flex justify-end mt-3 mb-4">
        <Button className="bg-slate-600" onClick={() => router.push("/employee/create")}>
          <Plus className="mr-1" size={16} /> Create
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={() => router.push(`/employee/${employee.id}`)}
            onDelete={() => handleDeleteConfirm(employee.id)}
          />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus karyawan ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EmployeeCard({ employee, onEdit, onDelete }) {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md flex justify-between">
      <div className="flex-1">
        <h2 className="md:text-xl font-bold text-gray-700">{employee.name}</h2>
        <p className="text-sm md:text-base text-gray-600">Gender: {employee.gender}</p>
        <p className="text-sm md:text-base text-gray-600">Status: {employee.status}</p>
        <div className="flex space-x-6 mt-1 text-[9px] md:text-xs text-gray-500">
          <p>Created At: {new Date(employee.createdAt).toLocaleDateString()}</p>
          <p>Updated At: {employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString() : "-"}</p>
        </div>
      </div>
      <div className="flex gap-3 items-end">
        <Pencil className="text-blue-500 cursor-pointer" size={16} onClick={onEdit} />
        <Trash className="text-red-500 cursor-pointer" size={16} onClick={onDelete} />
      </div>
    </div>
  );
}
