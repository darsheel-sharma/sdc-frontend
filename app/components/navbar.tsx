"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/app/lib/apiBaseUrl";
import {
  extractUser,
  extractUserFromToken,
  parseApiBody,
  type AuthUser,
} from "@/app/lib/authResponse";

export default function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const readStoredUser = () => {
      const storedUser = localStorage.getItem("auth-user");
      if (!storedUser) return null;

      try {
        return JSON.parse(storedUser) as AuthUser;
      } catch {
        localStorage.removeItem("auth-user");
        return null;
      }
    };

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const storedUser = readStoredUser();
      const fallbackUser =
        storedUser ?? (token ? extractUserFromToken(token) : null);

      if (storedUser) {
        setUser(storedUser);
      } else if (token) {
        const tokenUser = extractUserFromToken(token);
        if (tokenUser) {
          setUser(tokenUser);
          localStorage.setItem("auth-user", JSON.stringify(tokenUser));
        }
      }

      if (!token) {
        setLoading(false);
        router.push("/");
        return;
      }

      try {
        const url = getApiBaseUrl();

        const res = await fetch(`${url}/auth/get-user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await parseApiBody(res);
        const parsedUser = extractUser(data) ?? extractUserFromToken(token);

        if (res.ok && parsedUser) {
          setUser(parsedUser);
          localStorage.setItem("auth-user", JSON.stringify(parsedUser));
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("auth-user");
          router.push("/");
        } else if (fallbackUser) {
          setUser(fallbackUser);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("auth-user");
          router.push("/");
        }
      } catch (err) {
        console.error(err);
        if (!fallbackUser) {
          localStorage.removeItem("token");
          localStorage.removeItem("auth-user");
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const goToAccountOrHome = () => {
    router.push(pathname === "/profile" ? "/home" : "/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth-user");
    router.push("/");
  };

  return (
    <div className="relative bg-black px-4 py-4 sm:px-6">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3">
        <div className="text-2xl font-bold text-white sm:text-3xl">BuildSpace</div>

        <div className="hidden text-lg text-white md:block">
          {loading ? "Loading..." : `Welcome, ${user?.name || "User"}`} 
          {/* so here we will put the user if user name is not available */}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={goToAccountOrHome}
            className="rounded-md bg-white px-4 py-2 text-black hover:bg-gray-200"
          >
            {pathname === "/profile" ? "Home" : "My Account"}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Log Out
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="rounded-md border border-white/20 p-2 text-white md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="mx-auto mt-2 w-full max-w-6xl rounded-xl border border-white/10 bg-[#111] p-3 md:hidden">
          <div className="mb-3 text-sm text-white/85">
            {loading ? "Loading..." : `Welcome, ${user?.name || "User"}`}
          </div>
          <div className="grid gap-2">
            <button
              onClick={goToAccountOrHome}
              className="w-full rounded-md bg-white px-4 py-2 text-left text-black hover:bg-gray-200"
            >
              {pathname === "/profile" ? "Home" : "My Account"}
            </button>
            <button
              onClick={handleLogout}
              className="w-full rounded-md bg-red-500 px-4 py-2 text-left text-white hover:bg-red-600"
            >
              Log Out
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-2 block max-w-6xl text-sm text-white/85 md:hidden">
        {!isMenuOpen ? (loading ? "Loading..." : `Welcome, ${user?.name || "User"}`) : null}
      </div>
    </div>
  );
}
