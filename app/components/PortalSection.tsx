// components/PortalSection.jsx
import Link from "next/link";

export default function PortalSection() {
  return (
    <section className="bg-white flex items-center justify-center px-8 py-16">
      <div className="w-full max-w-md">
        <h2 className="text-4xl font-bold text-gray-900">Welcome Back</h2>

        <p className="mt-2 text-gray-500">
          Select your portal to securely access the system.
        </p>

        <div className="mt-10 space-y-5">
          <Link
            href="/admin"
            className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 text-lg font-medium text-gray-800 hover:bg-gray-100 transition"
          >
            <span>Admin Portal</span>
            <span>→</span>
          </Link>

          <Link
            href="/employee"
            className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 text-lg font-medium text-gray-800 hover:bg-gray-100 transition"
          >
            <span>Employee Portal</span>
            <span>→</span>
          </Link>
        </div>

        <p className="mt-10 text-sm text-gray-400">
          © 2026 GreatStack. All rights reserved.
        </p>
      </div>
    </section>
  );
}