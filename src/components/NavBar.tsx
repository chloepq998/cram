"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "홈" },
  { href: "/notes", label: "오답노트" },
  { href: "/plan", label: "학습계획" },
  { href: "/dashboard", label: "대시보드" },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-zinc-200 bg-white px-6 py-3">
      <span className="mr-4 text-sm font-bold text-zinc-900">
        벼락치기 학습 도우미
      </span>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
