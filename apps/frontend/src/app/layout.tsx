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
      <body className="bg-[var(--bg)] text-slate-900 antialiased">
        <AuthProvider>
          <div className="px-4 py-6">
            <Navbar />

            <main className="app-shell">{children}</main>

            <Toaster richColors position="top-right" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
