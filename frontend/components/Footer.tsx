import Link from "next/link";
import { Award, ShieldCheck, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-dark-bg text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-lg">Achievement2LinkedIn</span>
          </div>
          <p className="text-sm text-gray-400 max-w-md leading-relaxed">
            Turn certificates, course completions, awards, and hackathon wins into engaging, professional LinkedIn posts powered by AI.
          </p>
          <div className="flex items-center space-x-3 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Official LinkedIn OAuth 2.0 & REST APIs. Zero passwords collected.</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard/achievements/new" className="hover:text-white transition-colors">Upload Certificate</Link></li>
            <li><Link href="/dashboard/achievements" className="hover:text-white transition-colors">My Achievements</Link></li>
            <li><Link href="/dashboard/posts" className="hover:text-white transition-colors">LinkedIn Posts</Link></li>
            <li><Link href="/dashboard/settings" className="hover:text-white transition-colors">Settings</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal & Security</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li className="text-xs text-gray-500 pt-2 flex items-center space-x-1">
              <Lock className="w-3 h-3 text-gray-400" />
              <span>Encrypted OAuth Token Storage</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Achievement2LinkedIn. Built for ambitious professionals.</p>
        <p className="mt-2 sm:mt-0">Powered by FastAPI, Next.js, and Official LinkedIn APIs</p>
      </div>
    </footer>
  );
}
