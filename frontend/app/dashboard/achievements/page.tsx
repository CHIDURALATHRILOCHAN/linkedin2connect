"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Award, PlusCircle, Trash2, ArrowUpRight, FileText } from "lucide-react";

interface Achievement {
  id: string;
  file_name: string;
  achievement_type: string;
  processing_status: string;
  created_at: string;
  verified_data?: any;
}

export default function AchievementsListPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const data = await apiRequest<Achievement[]>("/achievements");
      setAchievements(data);
    } catch (err) {
      console.error("Failed to load achievements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this achievement record?")) return;

    try {
      await apiRequest(`/achievements/${id}`, { method: "DELETE" });
      setAchievements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || "Deletion failed.");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading achievements history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Achievements</h1>
          <p className="text-sm text-gray-400">All uploaded certificates, courses, and credentials.</p>
        </div>
        <Link
          href="/dashboard/achievements/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Certificate</span>
        </Link>
      </div>

      {achievements.length === 0 ? (
        <div className="p-12 glass-panel rounded-2xl text-center space-y-4 border-dashed border-gray-800">
          <FileText className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No achievements yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Upload your first certificate or award document to generate professional LinkedIn posts.
          </p>
          <Link
            href="/dashboard/achievements/new"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold"
          >
            Create Achievement
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const title = ach.verified_data?.achievement_title || ach.file_name;
            const org = ach.verified_data?.issuing_organization || "Organization";
            return (
              <Link
                key={ach.id}
                href={`/dashboard/achievements/${ach.id}`}
                className="block p-5 glass-panel glass-panel-hover rounded-2xl border border-gray-800 space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-blue-300 border border-gray-700">
                    {ach.processing_status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{org} • {ach.achievement_type}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
                  <span className="text-gray-500">{new Date(ach.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDelete(ach.id, e)}
                      className="p-1 text-gray-500 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-blue-400 font-semibold flex items-center">
                      Open <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
