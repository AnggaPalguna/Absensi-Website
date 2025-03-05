import ProtectedRoute from "@/components/ProtectedRoute";
import LayoutWrapper from "@/components/LayoutWrapper"; // Import LayoutWrapper
export default function Layout({ children }) {
  return (
    <ProtectedRoute>
      <LayoutWrapper>{children}</LayoutWrapper>
    </ProtectedRoute>
  );
}
