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
        <Input
          name="name"
          placeholder="Nama"
          value={employee.name}
          onChange={handleChange}
        />

        <Select name="gender" value={employee.gender || ""} onValueChange={(value) => setEmployee({ ...employee, gender: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select name="status" value={employee.status || ""} onValueChange={(value) => setEmployee({ ...employee, status: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button variant="outline" onClick={() => router.push("/employee")}>
            Back
          </Button>
        </div>
      </form>
    </div>
  );
}
