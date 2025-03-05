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

export default function CreateEmployee() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [uid, setUid] = useState("");
  const [unregisteredUids, setUnregisteredUids] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUids = async () => {
      const uidsRef = ref(database, "unregisteredUids");
      const snapshot = await get(uidsRef);
      if (snapshot.exists()) {
        setUnregisteredUids(Object.values(snapshot.val()));
      }
    };
    fetchUids();
  }, []);

  const handleCreate = async () => {
    if (!name || !gender || !uid) {
      alert("Semua field harus diisi");
      return;
    }
    const createdAt = new Date().toISOString();
    const status = "Active";
    
    await set(ref(database, `employees/${uid}`), {
      name,
      gender,
      createdAt,
      status,
    });
    
    await remove(ref(database, `unregisteredUids`));
    
    router.push("/employee");
  };

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Create Employee</h1>
      <Button variant="destructive" onClick={() => router.push("/employee")}>
        Back
      </Button>
      <div className="space-y-4">
        <Select onValueChange={setUid} value={uid}>
          <SelectTrigger>
            <SelectValue placeholder={unregisteredUids.length === 0 ? "No UID Available, Please tap new card" : "UID"} />
          </SelectTrigger>
          <SelectContent>
            {unregisteredUids.length > 0 ? (
              unregisteredUids.map((uidValue) => (
                <SelectItem key={uidValue} value={uidValue}>{uidValue}</SelectItem>
              ))
            ) : (
              <SelectItem disabled>No UID Available</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select onValueChange={setGender} value={gender}>
          <SelectTrigger>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleCreate} disabled={!name || !gender || !uid} className="w-full">
        Create Employee
      </Button>
    </div>
  );
}