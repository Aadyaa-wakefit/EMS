import Link from "next/link";

export default function PortalSection() {
  return (
    <section className="bg-white flex items-center justify-center px-8 py-16">
      <div className="w-full max-w-md">
        <h2 className="text-4xl font-bold text-gray-900">Welcome</h2>

        <p className="mt-2 text-gray-500">
          Sign in or create an account to access the workspace.
        </p>

        <div className="mt-10 space-y-5">
          <Link
            href="/auth"
            className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 text-lg font-medium text-gray-800 hover:bg-gray-100 transition"
          >
            <span>Continue to Sign In / Sign Up</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
