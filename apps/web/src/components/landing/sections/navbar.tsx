"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiveLogo } from "@hive/ui";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-lg border-b border-neutral-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <HiveLogo size="default" variant="white" showIcon showText />
          <span className="hidden sm:inline text-xs text-neutral-500 border-l border-neutral-700 pl-2 ml-1">
            Campus
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            About
          </Link>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/login?new=true"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
