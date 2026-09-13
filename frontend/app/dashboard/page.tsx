"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  Award,
  Linkedin,
  PlusCircle,
  FileCheck,
  Send,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";

interface DashboardStats {
  total_achievements: number;
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  failed_posts: number;
  linkedin_connected: boolean;
  linkedin_member_name?: string;
}

interface Achievement {
  id: string;
  file_name: string;
  achievement_type: string;
  processing_status: string;
  created_at: string;
  verified_data?: any;
}

interface PostItem {
  id: string;
  achievement_id: string;
  caption: string;
  status: string;
  linkedin_post_url?: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, linkedInStatus, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const [statsData, achData, postsData] = await Promise.all([
        apiRequest<DashboardStats>("/admin/dashboard-stats"),
        apiRequest<Achievement[]>("/achievements"),
        apiRequest<PostItem[]>("/posts"),
      ]);

      setStats(statsData);
      setAchievements(achData);
      setPosts(postsData);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      const res = await apiRequest<{ authorization_url: string }>("/linkedin/connect");
      window.location.href = res.authorization_url;
    } catch (err: any) {
      alert(`LinkedIn Connection Failed: ${err.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading your achievement dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border border-gray-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name}! 👋</h1>
          </div>
          <p className="text-sm text-gray-400">
            Transform your latest certificates & awards into verified, publication-ready LinkedIn posts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/achievements/new"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Achievement</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: LinkedIn Status */}
        <div className="glass-panel p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>LinkedIn Connection</span>
            <Linkedin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-lg font-bold ${linkedInStatus.connected ? "text-emerald-400" : "text-amber-400"}`}>
              {linkedInStatus.connected ? "Connected" : "Not Connected"}
            </span>
          </div>
          <div className="pt-1">
            {linkedInStatus.connected ? (
              <p className="text-xs text-gray-400 line-clamp-1">Connected as {linkedInStatus.member_name}</p>
            ) : (
              <button
                onClick={handleConnectLinkedIn}
                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Connect LinkedIn
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Create Achievement Launcher */}
        <div className="glass-panel p-5 rounded-2xl space-y-3 border-blue-500/30 bg-blue-950/20">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-300 uppercase tracking-wider">
            <span>Create Achievement</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-bold text-white block">Upload Certificate</span>
            <p className="text-xs text-gray-400">PDF, PNG, or JPG document parsing.</p>
          </div>
          <Link
            href="/dashboard/achievements/new"
            className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            <span>Start Upload Flow</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Processed Achievements */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Processed Achievements</span>
            <FileCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-3xl font-extrabold text-white">{stats?.total_achievements || 0}</span>
          <p className="text-xs text-gray-400">Certificates parsed & extracted</p>
        </div>

        {/* Card 4: Published Posts */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>LinkedIn Published Posts</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{stats?.published_posts || 0}</span>
            <span className="text-xs text-gray-400">/ {stats?.total_posts || 0} total</span>
          </div>
          <p className="text-xs text-gray-400">Posts live on your profile feed</p>
        </div>
      </div>

      {/* Sections Grid: Achievements & Recent Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Recent Achievements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span>Recent Achievements</span>
            </h2>
            <Link href="/dashboard/achievements" className="text-xs text-blue-400 hover:underline">
              View All ({achievements.length})
            </Link>
          </div>

          {achievements.length === 0 ? (
            <div className="p-8 glass-panel rounded-2xl text-center space-y-3 border-dashed border-gray-800">
              <FileText className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm text-gray-400">No achievements uploaded yet.</p>
              <Link
                href="/dashboard/achievements/new"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Upload First Certificate
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {achievements.slice(0, 4).map((ach) => {
                const title = ach.verified_data?.achievement_title || ach.file_name;
                const org = ach.verified_data?.issuing_organization || "Organization";
                return (
                  <Link
                    key={ach.id}
                    href={`/dashboard/achievements/${ach.id}`}
                    className="block p-4 glass-panel glass-panel-hover rounded-xl border border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-white">{title}</h4>
                        <p className="text-xs text-gray-400">{org} • {ach.achievement_type}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-800 text-blue-300 border border-gray-700">
                        {ach.processing_status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Published & Draft Posts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <span>Recent Posts</span>
            </h2>
            <Link href="/dashboard/posts" className="text-xs text-blue-400 hover:underline">
              View Posts History
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="p-8 glass-panel rounded-2xl text-center space-y-3 border-dashed border-gray-800">
              <Sparkles className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm text-gray-400">No generated posts found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 4).map((p) => (
                <div key={p.id} className="p-4 glass-panel rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider text-gray-400">
                      Post #{p.id.substring(0, 8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "PUBLISHED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : p.status === "FAILED"
                          ? "bg-red-950 text-red-400 border border-red-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{p.caption}</p>
                  {p.linkedin_post_url && (
                    <a
                      href={p.linkedin_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:underline pt-1"
                    >
                      <span>View on LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
