"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? "/login" : "/register";

    try {
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }

      const res = await fetch(`${apiUrl}/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        router.push("/home");
      } else {
        alert(data.error || "Authentication Failed");
      }
    } catch (err) {
      console.error(err);
      alert("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) {
      alert("Google login failed");
      return;
    }

    try {
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }

      setGoogleLoading(true);

      const res = await fetch(`${apiUrl}/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        router.push("/home");
      } else {
        alert(data.error || "Google login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Could not connect to server");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F2F0EF]">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1c1b20] items-center justify-center p-12 text-white">
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold mb-6">Welcome to NovaNews</h1>
          <p className="text-lg text-gray-400">
            A full-stack personalized news dashboard with AI-powered summaries.
          </p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl flex flex-col">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              {isLogin
                ? "Please enter your details to sign in."
                : "Fill in your details to get started."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#1c1b20]/30 focus:outline-none focus:ring-2 focus:ring-[#1c1b20]/50 transition-colors"
                  placeholder="Your Name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#1c1b20]/30 focus:outline-none focus:ring-2 focus:ring-[#1c1b20]/50 transition-colors"
                placeholder="Your Email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                {isLogin && (
                  <a
                    href="#"
                    className="text-sm font-semibold text-[#1c1b20]/80 hover:text-[#1c1b20]/50"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#1c1b20]/30 focus:outline-none focus:ring-2 focus:ring-[#1c1b20]/50 transition-colors"
                placeholder="Your Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1c1b20] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1c1b20]/80 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors mt-2"
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center space-x-4">
            <div className="h-px w-full bg-gray-200"></div>
            <span className="text-sm text-gray-500 font-medium">or</span>
            <div className="h-px w-full bg-gray-200"></div>
          </div>

          <div className="mt-6 flex justify-center">
            {googleClientId ? (
              <div
                className={
                  googleLoading ? "pointer-events-none opacity-70" : ""
                }
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => alert("Google login failed")}
                  theme="outline"
                  text="continue_with"
                  shape="rectangular"
                  size="large"
                />
              </div>
            ) : (
              <p className="text-sm text-center text-red-600">
                Google login is unavailable because{" "}
                <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> is not set.
              </p>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-[#1c1b20]/80 hover:text-[#1c1b20]/50 focus:outline-none"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
