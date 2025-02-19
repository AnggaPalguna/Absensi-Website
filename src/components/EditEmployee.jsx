"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { database } from "../../firebase-config";
import { ref, get, update } from "firebase/database";
import { TextField, Button, FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";

export default function EditEmployee({ uid }) {
  const [employee, setEmployee] = useState({ name: "", gender: "", status: "" });
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
  }, [uid]);

  const handleChange = (e) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedEmployee = {
      ...employee,
      updatedAt: new Date().toISOString(),
    };

    const employeeRef = ref(database, `employees/${uid}`);

    await update(employeeRef, updatedEmployee);

    router.push("/employee");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-8">Edit Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <FormControl fullWidth>
          <InputLabel className="bg-white text-center">Status</InputLabel>
          <Select name="status" value={employee.status || ""} onChange={handleChange}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        <Box display="flex" gap={2}>
          <Button variant="contained" color="primary" type="submit">
            Save
          </Button>
          <Button variant="contained" color="secondary" onClick={() => router.push("/employee")}>
            Back
          </Button>
        </Box>
      </form>
    </div>
  );
}
