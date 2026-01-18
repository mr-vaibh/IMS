import CompanySettings from "@/features/settings/CompanySettings";
import AccountSettings from "@/features/settings/AccountSettings";
import AdminManagement from "@/features/settings/AdminManagement";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Settings</h1>

      <CompanySettings />
      <AccountSettings />
      <AdminManagement />
    </div>
  );
}
