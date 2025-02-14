"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, get, remove } from "firebase/database";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

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
        const employeeList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
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
      <div className="grid justify-items-end mb-4">
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={() => router.push("/employee/create")}
        >
          Create
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

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin menghapus karyawan ini?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">Batal</Button>
          <Button onClick={handleDelete} color="secondary">Hapus</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export function EmployeeCard({ employee, onEdit, onDelete }) {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md flex">
      <div className="flex-1 flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-700">{employee.name}</h2>
        <p className="text-gray-600">Gender: {employee.gender}</p>
        <p className="text-sm text-gray-500">Created At: {new Date(employee.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex gap-3 items-end">
        <EditIcon className="text-blue-500 cursor-pointer" fontSize="small" onClick={onEdit} />
        <DeleteIcon className="text-red-500 cursor-pointer" fontSize="small" onClick={onDelete} />
      </div>
    </div>
  );
}