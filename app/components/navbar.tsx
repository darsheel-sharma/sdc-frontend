"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface User {
  name: string;
  email?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        router.push("/");
        return;
      }

      try {
        const url = process.env.NEXT_PUBLIC_API_URL;

        if (!url) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured.");
        }

        const res = await fetch(`${url}/auth/get-user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();

        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
          router.push("/");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  return (
    <div className="h-[5rem] bg-black flex items-center justify-between p-10">
      <div className="text-white text-3xl">NovaNews</div>
      <div className="text-white text-3xl">
        {loading ? "Loading..." : `Welcome, ${user?.name || "User"}`}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(pathname === "/library" ? "/home" : "/library")}
          className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200"
        >
          {pathname === "/library" ? "Home" : "Library"}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/");
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
