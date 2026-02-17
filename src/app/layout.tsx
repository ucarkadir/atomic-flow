import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atomic Flow",
  description: "Atomic habits score tracking app"
};

const navItems = [
  { href: "/setup", label: "Setup" },
  { href: "/daily", label: "Daily" },
  { href: "/weekly", label: "Weekly" },
  { href: "/monthly", label: "Monthly" },
  { href: "/help", label: "Help" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
          <header className="mb-6 rounded-xl border bg-white/80 p-4 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/weekly" className="text-lg font-semibold">
                Atomic Flow
              </Link>
              <nav className="flex flex-wrap items-center gap-3 text-sm">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded px-2 py-1 hover:bg-secondary">
                    {item.label}
                  </Link>
                ))}
                <Link href="/logout" className="rounded bg-secondary px-2 py-1">
                  Logout
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
