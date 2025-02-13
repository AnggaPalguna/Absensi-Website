import EditEmployee from "@/components/EditEmployee";

export default function EditEmployeePage({ params }) {
  return <EditEmployee uid={params.uid} />;
}
