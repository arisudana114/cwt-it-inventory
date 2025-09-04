"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";
import { ThemeToggle } from "./ui/theme-toggle";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/documents", label: "Documents" },
    { href: "/products", label: "Products" },
    { href: "/history", label: "History" },
    { href: "/documents/new", label: "New Document" },
  ];

  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  // Re-check session on mount and when route changes (login/logout)
  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => setLoggedIn(!!data.loggedIn))
      .catch(() => setLoggedIn(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/logout");
    setLoggedIn(false);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background px-6 py-4 mb-4">
      <div className="flex gap-6 text-sm font-medium items-center">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "hover:text-yellow-300 transition-colors",
              pathname === item.href
                ? "text-yellow-300"
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="ml-4 px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-900 cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="ml-4 px-3 py-1 rounded bg-yellow-300 text-black hover:bg-yellow-400 cursor-pointer"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
