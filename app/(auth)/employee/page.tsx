// app/(auth)/employee/page.tsx
import HeroSection from "../../components/HeroSection";
import Link from "next/link";

export default function EmployeePage() {
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Side */}
      <HeroSection />

      {/* Right Side */}
      <section className="bg-white flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to portals
          </Link>

          {/* Heading */}
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Employee Portal
          </h1>

          <p className="mt-2 text-gray-500">
            Sign in to access your dashboard
          </p>

          {/* Form */}
          <form className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                placeholder="employee@example.com"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-500 text-white py-3 font-medium hover:opacity-90 transition"
            >
              Sign In
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}