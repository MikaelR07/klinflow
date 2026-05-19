import { Outlet } from "react-router-dom";

export default function CollectionsLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* TODO: Add Domain-Specific Sidebar */}
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Collections Domain</h1>
        <Outlet />
      </div>
    </div>
  );
}
