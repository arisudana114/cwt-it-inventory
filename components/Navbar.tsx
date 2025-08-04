"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
