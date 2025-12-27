import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto p-6">{children}</main>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
