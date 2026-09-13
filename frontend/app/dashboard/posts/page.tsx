"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Send, ExternalLink, Linkedin, Sparkles } from "lucide-react";

interface PostItem {
  id: string;
  achievement_id: string;
  caption: string;
  hashtags: string[];
  tone: string;
  status: string;
  linkedin_post_id?: string;
  linkedin_post_url?: string;
  error_message?: string;
  created_at: string;
  published_at?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await apiRequest<PostItem[]>("/posts");
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading post history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">LinkedIn Posts History</h1>
          <p className="text-sm text-gray-400">Manage drafts, published posts, and LinkedIn references.</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-12 glass-panel rounded-2xl text-center space-y-4 border-dashed border-gray-800">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No posts created yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Upload an achievement to generate AI post variations and publish directly to LinkedIn.
          </p>
          <Link
            href="/dashboard/achievements/new"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold"
          >
            Create Achievement Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="p-6 glass-panel rounded-2xl border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Post Tone: {p.tone}</h4>
                    <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
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

              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed bg-dark-bg/60 p-4 rounded-xl border border-gray-800/80">
                {p.caption}
              </p>

              {p.error_message && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                  <span className="font-semibold">Publication Error:</span> {p.error_message}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
                <Link
                  href={`/dashboard/achievements/${p.achievement_id}`}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  View Achievement Workspace →
                </Link>

                {p.linkedin_post_url && (
                  <a
                    href={p.linkedin_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-950/60 border border-blue-800 text-blue-300 hover:text-white rounded-lg font-semibold transition-colors"
                  >
                    <span>Open On LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
