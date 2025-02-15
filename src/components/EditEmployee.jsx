"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, get, update, remove, set } from "firebase/database";
import { MenuItem, Select, TextField, Button, FormControl, InputLabel, Box } from "@mui/material";

export default function EditEmployee({ uid }) {
  const [employee, setEmployee] = useState({ name: "", gender: "" });
  const [availableUids, setAvailableUids] = useState([{ key: uid, value: uid }]);
  const [newUid, setNewUid] = useState(uid);
  const router = useRouter();

  useEffect(() => {
    if (uid) {
      const fetchEmployee = async () => {
        const employeeRef = ref(database, `employees/${uid}`);
        const snapshot = await get(employeeRef);
        if (snapshot.exists()) {
          setEmployee(snapshot.val());
        }
      };
      fetchEmployee();
    }

    const fetchUnregisteredUids = async () => {
      const unregRef = ref(database, "unregisteredUids");
      const snapshot = await get(unregRef);
      if (snapshot.exists()) {
        const unregUids = Object.entries(snapshot.val()).map(([key, value]) => ({ key, value }));
        setAvailableUids([{ key: uid, value: uid }, ...unregUids]);
      }
    };
    fetchUnregisteredUids();
  }, [uid]);

  const handleChange = (e) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const handleUidChange = (e) => {
    setNewUid(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUid.trim()) {
      alert("UID tidak boleh kosong!");
      return;
    }

    const updatedEmployee = {
      ...employee,
      updatedAt: new Date().toISOString(),
    };

    const oldRef = ref(database, `employees/${uid}`);
    const newRef = ref(database, `employees/${newUid}`);

    if (uid !== newUid) {
      await set(newRef, updatedEmployee);
      await remove(oldRef);
    } else {
      await update(oldRef, updatedEmployee);
    }

    const selectedUnregistered = availableUids.find((u) => u.value === newUid);
    if (selectedUnregistered && selectedUnregistered.key !== uid) {
      const unregRef = ref(database, `unregisteredUids/${selectedUnregistered.key}`);
      await remove(unregRef);
    }

    router.push("/employee");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-8">Edit Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormControl fullWidth>
          <InputLabel className="bg-white text-center">ID Karyawan</InputLabel>
          <Select value={newUid} onChange={handleUidChange}>
            {availableUids.map(({ key, value }) => (
              <MenuItem key={key} value={value}>{value}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          name="name"
          label="Nama"
          value={employee.name}
          onChange={handleChange}
        />

        <FormControl fullWidth>
          <InputLabel className="bg-white text-center">Gender</InputLabel>
          <Select name="gender" value={employee.gender || ""} onChange={handleChange}>
            <MenuItem value="Male">Laki-laki</MenuItem>
            <MenuItem value="Female">Perempuan</MenuItem>
          </Select>
        </FormControl>

        <Box display="flex" gap={2}>
          <Button variant="contained" color="primary" type="submit">Save</Button>
          <Button variant="contained" color="secondary" onClick={() => router.push("/employee")}>
            Back
          </Button>
        </Box>
      </form>
    </div>
  );
}
