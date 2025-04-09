"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, get, remove } from "firebase/database";
import { Pencil, Trash, Plus, Users, Search, UserPlus, AlertCircle } from "lucide-react";
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
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesRef = ref(database, "employees");
        const snapshot = await get(employeesRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const employeeList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setEmployees(employeeList);
          setFilteredEmployees(employeeList);
        } else {
          setEmployees([]);
          setFilteredEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.nik.includes(searchTerm)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const handleDeleteConfirm = (id) => {
    setSelectedId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (selectedId) {
      try {
        await remove(ref(database, `employees/${selectedId}`));
        setEmployees(employees.filter((employee) => employee.id !== selectedId));
        setFilteredEmployees(filteredEmployees.filter((employee) => employee.id !== selectedId));
      } catch (error) {
        console.error("Error deleting employee:", error);
      } finally {
        setOpen(false);
        setSelectedId(null);
      }
    }
  };

  return (
    <div className=" min-h-screen pb-10">
      {/* Header */}
      <div className="p-6">
          <h1 className="text-3xl max-sm:text-2xl font-bold mb-2 flex items-center">
            <Users className="mr-3" />
            Daftar Karyawan
          </h1>
          <p className="">Kelola data karyawan dengan mudah</p>
      </div>

      <div className="mx-auto px-4 ">
        {/* Search and Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto transition-all flex items-center" 
            onClick={() => router.push("/employee/create")}
          >
            <UserPlus className="mr-2" size={18} />
            Tambah Karyawan Baru
          </Button>
        </div>

        {/* Employee Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={() => router.push(`/employee/${employee.id}`)}
                onDelete={() => handleDeleteConfirm(employee.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            {searchTerm ? (
              <>
                <Search className="h-12 w-12 mb-4" />
                <p className="text-xl font-medium">Tidak ada hasil yang ditemukan</p>
                <p className="text-sm mt-2">Coba dengan kata kunci lain</p>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 mb-4" />
                <p className="text-xl font-medium">Belum ada data karyawan</p>
                <p className="text-sm mt-2">Klik tombol "Tambah Karyawan Baru" untuk menambahkan</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-semibold">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">Apakah Anda yakin ingin menghapus karyawan ini?</p>
            <p className="text-gray-500 text-sm mt-2">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              className="border-gray-300" 
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EmployeeCard({ employee, onEdit, onDelete }) {
  // Function to calculate years of service
  const calculateYearsOfService = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffYears = now.getFullYear() - created.getFullYear();
    
    // Check if birthday has occurred this year
    if (
      now.getMonth() < created.getMonth() ||
      (now.getMonth() === created.getMonth() && now.getDate() < created.getDate())
    ) {
      return diffYears - 1;
    }
    
    return diffYears;
  };

  // Function to format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadgeColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'aktif':
        return 'bg-green-100 text-green-800';
      case 'cuti':
        return 'bg-yellow-100 text-yellow-800';
      case 'tidak aktif':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-1">
            {employee.position}
          </span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(employee.status)}`}>
          {employee.status}
        </span>
      </div>
      
      <div className="space-y-2 mt-3">
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-20">NIK</span>
          <span className="text-gray-800 font-medium">{employee.nik}</span>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-20">Tempat Lahir</span>
          <span className="text-gray-800">{employee.birthplace}</span>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-20">Tanggal Lahir</span>
          <span className="text-gray-800">{employee.birthdate}</span>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-20">Gender</span>
          <span className="text-gray-800">{employee.gender}</span>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Dibuat: {formatDate(employee.createdAt)}</span>
          <span>Diperbarui: {formatDate(employee.updatedAt)}</span>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
          onClick={onEdit}
        >
          <Pencil className="mr-1" size={14} />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={onDelete}
        >
          <Trash className="mr-1" size={14} />
          Hapus
        </Button>
      </div>
    </div>
  );
}