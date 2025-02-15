"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, set, get, remove } from "firebase/database";
import { Button, TextField, MenuItem } from "@mui/material";

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
    
    await set(ref(database, `employees/${uid}`), {
      name,
      gender,
      createdAt,
    });
    
    await remove(ref(database, `unregisteredUids`));
    
    router.push("/employee");
  };

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Create Employee</h1>
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={() => router.push("/employee")} 
        className="mb-4"
      >
        Back
      </Button>
      <TextField
        select
        label={unregisteredUids.length === 0 ? "No UID Available, Please tap new card" : "UID"}
        fullWidth
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        margin="normal"
        disabled={unregisteredUids.length === 0}
      >
        {unregisteredUids.length > 0 ? (
          unregisteredUids.map((uidValue) => (
            <MenuItem key={uidValue} value={uidValue}>{uidValue}</MenuItem>
          ))
        ) : (
          <MenuItem disabled>No UID Available</MenuItem>
        )}
      </TextField>
      <TextField
        label="Name"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
      />
      <TextField
        select
        label="Gender"
        fullWidth
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        margin="normal"
      >
        <MenuItem value="Male">Male</MenuItem>
        <MenuItem value="Female">Female</MenuItem>
      </TextField>
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth 
        className="top-4"
        onClick={handleCreate}
        disabled={!name || !gender || !uid}
      >
        Create Employee
      </Button>
    </div>
  );
}
