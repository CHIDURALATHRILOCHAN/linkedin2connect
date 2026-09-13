"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Award, Linkedin, LogOut, User, PlusCircle, Settings, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { user, linkedInStatus, logout } = useAuth();

  return (
    <nav className="border-b border-gray-800 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">
                Achievement<span className="text-blue-500">2LinkedIn</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">AI Post Platform</span>
            </div>
          </Link>

          {/* Center Links (when logged in) */}
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard/achievements" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
                My Achievements
              </Link>
              <Link href="/dashboard/posts" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
                Published Posts
              </Link>
              <Link href="/dashboard/settings" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
                Settings
              </Link>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* LinkedIn Badge */}
                <div
                  className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    linkedInStatus.connected
                      ? "bg-blue-950/40 border-blue-500/40 text-blue-300"
                      : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  }`}
                >
                  <Linkedin className="w-3.5 h-3.5 fill-current" />
                  <span>{linkedInStatus.connected ? "LinkedIn Connected" : "LinkedIn Not Connected"}</span>
                </div>

                {/* Create CTA */}
                <Link
                  href="/dashboard/achievements/new"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Achievement</span>
                </Link>

                {/* User Menu / Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm text-gray-300 hover:text-white px-3 py-2 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
