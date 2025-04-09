"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, set, get, remove } from "firebase/database";
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
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function CreateEmployee() {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [position, setPosition] = useState("");
  const [birthplace, setBirthplace] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [nik, setNik] = useState("");
  const [unregisteredUids, setUnregisteredUids] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUids = async () => {
      setIsLoading(true);
      try {
        const uidsRef = ref(database, "unregisteredUids");
        const snapshot = await get(uidsRef);
        if (snapshot.exists()) {
          setUnregisteredUids(Object.values(snapshot.val()));
        }
      } catch (error) {
        console.error("Error fetching UIDs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUids();
  }, []);

  useEffect(() => {
    if (unregisteredUids.length > 0 && !uid) {
      setUid(unregisteredUids[0]);
    }
  }, [unregisteredUids]);

  const handleCreate = async () => {
    if (!name || !nickname || !gender || !uid || !position || !birthplace || !birthdate || !nik) {
      alert("Semua field harus diisi");
      return;
    }
    
    setIsLoading(true);
    try {
      const createdAt = new Date().toISOString();

      await set(ref(database, `employees/${uid}`), {
        name,
        nickname,
        gender,
        status,
        position,
        birthplace,
        birthdate,
        nik,
        createdAt,
      });

      await remove(ref(database, `unregisteredUids`));
      router.push("/employee");
    } catch (error) {
      console.error("Error creating employee:", error);
      alert("Terjadi kesalahan saat membuat karyawan baru");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name && nickname && gender && uid && position && birthplace && birthdate && nik;

  return (
    <div className="container mx-auto px-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl max-sm:text-base font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Buat Karyawan Baru
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="uid" className="text-sm font-medium">UID Kartu</Label>
              <Select 
                onValueChange={setUid} 
                value={uid} 
                disabled={isLoading || unregisteredUids.length === 0}
              >
                <SelectTrigger id="uid" className="w-full">
                  <SelectValue 
                    placeholder={unregisteredUids.length === 0 ? 
                      "Tidak ada UID tersedia, silakan tap kartu baru" : "Pilih UID"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {unregisteredUids.length > 0 ? (
                    unregisteredUids.map((uidValue) => (
                      <SelectItem key={uidValue} value={uidValue}>{uidValue}</SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled>Tidak ada UID tersedia</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nama Lengkap</Label>
              <Input 
                id="name"
                placeholder="Masukkan nama lengkap" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm font-medium">Nama Panggilan (Maks. 16 karakter)</Label>
              <Input 
                id="nickname"
                placeholder="Masukkan nama panggilan" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value.slice(0, 16))} 
                disabled={isLoading}
                maxLength={16}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nik" className="text-sm font-medium">NIK</Label>
              <Input 
                id="nik"
                placeholder="Nomor Induk Kependudukan" 
                value={nik} 
                onChange={(e) => setNik(e.target.value)} 
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthplace" className="text-sm font-medium">Tempat Lahir</Label>
              <Input 
                id="birthplace"
                placeholder="Contoh: Jakarta" 
                value={birthplace} 
                onChange={(e) => setBirthplace(e.target.value)} 
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate" className="text-sm font-medium">Tanggal Lahir</Label>
              <Input 
                id="birthdate"
                type="date" 
                value={birthdate} 
                onChange={(e) => setBirthdate(e.target.value)} 
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium">Jenis Kelamin</Label>
              <Select 
                onValueChange={setGender} 
                value={gender}
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
                onValueChange={setPosition} 
                value={position}
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
                onValueChange={setStatus} 
                value={status}
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
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={!isFormValid || isLoading} 
            className="w-full mt-8 py-6"
          >
            {isLoading ? "Memproses..." : (
              <span className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Buat Karyawan
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}