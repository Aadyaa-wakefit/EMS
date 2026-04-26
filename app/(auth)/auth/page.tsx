"use client"

import HeroSection from "@/app/components/HeroSection"
import Link from "next/link"
import { signIn, signUp } from "@/app/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type Mode = "signin" | "signup"

const MIN_PASSWORD_LENGTH = 8

function destinationForRole(role: unknown): string {
  return role === "admin" ? "/admin" : "/leaves"
}

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const switchMode = (next: Mode) => {
    if (loading) return
    setMode(next)
    setError(null)
    setPassword("")
    setConfirmPassword("")
  }

  const handleSignIn = async () => {
    const res = await signIn.email({
      email: email.trim(),
      password,
    })

    if (res.error) {
      setError(res.error.message ?? "Unable to sign in")
      return
    }

    const role = (res.data as { user?: { role?: unknown } } | null)?.user?.role
    router.push(destinationForRole(role))
  }

  const handleSignUp = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const res = await signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    })

    if (res.error) {
      setError(res.error.message ?? "Unable to create account")
      return
    }

    const role = (res.data as { user?: { role?: unknown } } | null)?.user?.role
    router.push(destinationForRole(role))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "signin") {
        await handleSignIn()
      } else {
        await handleSignUp()
      }
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isSignIn = mode === "signin"
  const submitLabel = loading
    ? isSignIn ? "Signing in..." : "Creating account..."
    : isSignIn ? "Sign In" : "Create Account"

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <HeroSection />

      <section className="bg-white flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to home
          </Link>

          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>

          <p className="mt-2 text-gray-500">
            {isSignIn
              ? "Sign in to continue to your dashboard"
              : "Join your team's workspace in seconds"}
          </p>

          <div className="mt-8 inline-flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              aria-pressed={isSignIn}
              className={`rounded-md px-4 py-2 transition ${
                isSignIn
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              aria-pressed={!isSignIn}
              className={`rounded-md px-4 py-2 transition ${
                !isSignIn
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            {!isSignIn && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignIn ? undefined : MIN_PASSWORD_LENGTH}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {!isSignIn ? (
                <p className="mt-1.5 text-xs text-gray-400">
                  Must be at least {MIN_PASSWORD_LENGTH} characters
                </p>
              ) : null}
            </div>

            {!isSignIn && (
              <div>
                <label
                  htmlFor="auth-confirm"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm password
                </label>
                <input
                  id="auth-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-500 text-white py-3 font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
