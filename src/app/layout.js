import { Roboto, Open_Sans } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"], // Sesuaikan dengan kebutuhan
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Sistem Absensi LPD",
  description: "Dibuat untuk mencatat kehadiran dengan mudah dan efisien",  
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${openSans.variable} antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
