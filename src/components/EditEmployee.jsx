"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, get, update } from "firebase/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, UserCog } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function EditEmployee({ uid }) {
  const [employee, setEmployee] = useState({
    name: "",
    nickname: "",
    gender: "",
    status: "",
    position: "",
    birthplace: "",
    birthdate: "",
    nik: "",
    originalName: "", // To store original name for comparison
    originalPosition: "", // To store original position for comparison
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (uid) {
      const fetchEmployee = async () => {
        setIsLoading(true);
        try {
          const employeeRef = ref(database, `employees/${uid}`);
          const snapshot = await get(employeeRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Handle case where nickname doesn't exist in older records
            if (!data.nickname && data.name) {
              data.nickname = data.name.slice(0, 16);
            }
            // Handle case where fullname was previously saved as name
            if (data.fullname && !data.nickname) {
              data.name = data.fullname;
              data.nickname = data.fullname.slice(0, 16);
            }
            // Store original values for comparison during update
            data.originalName = data.name;
            data.originalPosition = data.position;
            setEmployee(data);
          } else {
            alert("Data karyawan tidak ditemukan");
            router.push("/employee");
          }
        } catch (error) {
          console.error("Error fetching employee data:", error);
          alert("Terjadi kesalahan saat mengambil data karyawan");
        } finally {
          setIsLoading(false);
        }
      };
      fetchEmployee();
    }
  }, [uid, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nickname field's character limit
    if (name === "nickname" && value.length > 16) {
      setEmployee({ ...employee, [name]: value.slice(0, 16) });
    } else {
      setEmployee({ ...employee, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Remove temporary original fields before saving
      const { originalName, originalPosition, ...employeeData } = employee;
      
      const updatedEmployee = {
        ...employeeData,
        updatedAt: new Date().toISOString(),
      };

      // Update employee data
      const employeeRef = ref(database, `employees/${uid}`);
      await update(employeeRef, updatedEmployee);
      
      // Check if name or position has changed
      if (employee.name !== originalName || employee.position !== originalPosition) {
        console.log("Name or position changed, updating attendance records");
        
        // Get all attendance records
        const attendanceRef = ref(database, 'attendance');
        const attendanceSnapshot = await get(attendanceRef);
        
        if (attendanceSnapshot.exists()) {
          const attendanceData = attendanceSnapshot.val();
          const updates = {};
          
          // Loop through all dates in attendance
          Object.keys(attendanceData).forEach(date => {
            // Check if this employee has an attendance record for this date
            if (attendanceData[date][uid]) {
              // Update name and position in attendance record
              updates[`attendance/${date}/${uid}/name`] = employee.name;
              updates[`attendance/${date}/${uid}/position`] = employee.position;
            }
          });
          
          // Apply all updates at once if there are any
          if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
          }
        }
      }
      
      router.push("/employee");
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Terjadi kesalahan saat memperbarui data karyawan");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = employee.name && employee.nickname && employee.gender && employee.position && 
                     employee.birthplace && employee.birthdate && employee.nik && employee.status;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl max-sm:text-base font-bold flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              Edit Data Karyawan
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/employee")}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nama Lengkap</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Masukkan nama lengkap" 
                  value={employee.name || ""} 
                  onChange={handleChange} 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm font-medium">Nama Panggilan (Maks. 16 karakter)</Label>
                <Input 
                  id="nickname"
                  name="nickname"
                  placeholder="Masukkan nama panggilan" 
                  value={employee.nickname || ""} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  maxLength={16}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik" className="text-sm font-medium">NIK</Label>
                <Input 
                  id="nik"
                  name="nik"
                  placeholder="Nomor Induk Kependudukan" 
                  value={employee.nik || ""} 
                  onChange={handleChange} 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthplace" className="text-sm font-medium">Tempat Lahir</Label>
                <Input 
                  id="birthplace"
                  name="birthplace"
                  placeholder="Contoh: Jakarta" 
                  value={employee.birthplace || ""} 
                  onChange={handleChange} 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-sm font-medium">Tanggal Lahir</Label>
                <Input 
                  id="birthdate"
                  name="birthdate"
                  type="date" 
                  value={employee.birthdate || ""} 
                  onChange={handleChange} 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">Jenis Kelamin</Label>
                <Select 
                  value={employee.gender || ""} 
                  onValueChange={(value) => setEmployee({ ...employee, gender: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium">Posisi</Label>
                <Select 
                  value={employee.position || ""} 
                  onValueChange={(value) => setEmployee({ ...employee, position: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Pilih posisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ketua">Ketua</SelectItem>
                    <SelectItem value="Sekretaris">Sekretaris</SelectItem>
                    <SelectItem value="Bendahara">Bendahara</SelectItem>
                    <SelectItem value="Bagian Dana">Bagian Dana</SelectItem>
                    <SelectItem value="Bagian Kredit">Bagian Kredit</SelectItem>
                    <SelectItem value="Bagian Umum">Bagian Umum</SelectItem>
                    <SelectItem value="Kolektor">Kolektor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select 
                  value={employee.status || ""} 
                  onValueChange={(value) => setEmployee({ ...employee, status: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 pt-4 flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  disabled={!isFormValid || isLoading} 
                  className="w-full py-6"
                >
                  {isLoading ? "Menyimpan..." : (
                    <span className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Simpan Perubahan
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}