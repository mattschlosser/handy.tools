"use client";
import Link from "next/link";
import { ModeToggle } from "../ui/mode-toggle";

export function Navigation() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 w-full">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <div className="text-2xl">Tiny Vid</div>
        </Link>
      </nav>
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </header>
  );
}
