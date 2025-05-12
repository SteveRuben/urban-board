"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  const navLinks = [
    { label: "Challenges", baseUrl: "/challenges" },
    { label: "Steps", baseUrl: "/steps" },
    { label: "Test cases", baseUrl: "/testcases" },
    { label: "Participates", baseUrl: "/participates" },
  ];

  return (
    <header className="fixed top-5 left-0 w-full z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            height={6}
            width={6}
            className="w-6 h-6 bg-white rounded-full"
          />
          <span className="text-white font-semibold text-lg">RecruteIA</span>
        </Link>

        {/* Links */}
        <ul className="hidden md:flex items-center space-x-4 text-sm font-medium bg-[#0B0B0F]/50  text-white p-3 rounded-full">
          <li>
            <Link href="/codingame">
              <span className="bg-[#0E0E13] text-cyan-400 px-3 py-1.5 rounded-full hover:bg-cyan-950 transition-all">
                Codingame
              </span>
            </Link>
          </li>
          {navLinks.map((navLink, index) => (
            <li key={index}>
              <Link href={`/codingame/${navLink.baseUrl}`}>
                <span className="hover:text-cyan-400 transition-colors">
                  {navLink.label}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/codingame">
              <span className="bg-white/10 px-3 py-1.5 rounded-md text-sm hover:bg-white/20 transition-all">
                Express yourself
              </span>
            </Link>
          </li>
        </ul>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/signup"
            className="bg-cyan-400 text-black px-4 py-2 rounded-md font-semibold text-sm hover:bg-cyan-300 transition-colors flex gap-1 items-center"
          >
            <Plus /> New Challenge
          </motion.a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
