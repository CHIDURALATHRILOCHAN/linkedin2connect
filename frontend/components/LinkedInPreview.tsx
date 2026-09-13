"use client";

import React from "react";
import Image from "next/image";
import { ThumbsUp, MessageSquare, Repeat2, Send, Globe, AlertCircle, Award } from "lucide-react";

interface LinkedInPreviewProps {
  userName: string;
  userHeadline?: string;
  userAvatar?: string;
  caption: string;
  hashtags: string[];
  mediaUrl?: string;
  mediaTitle?: string;
  isPublished?: boolean;
}

export default function LinkedInPreview({
  userName,
  userHeadline,
  userAvatar,
  caption,
  hashtags,
  mediaUrl,
  mediaTitle = "Achievement Certificate",
  isPublished = false
}: LinkedInPreviewProps) {
  const avatarSrc = userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || "User")}`;

  // Formatted caption with hashtags attached if not present
  const hashtagsString = hashtags && hashtags.length > 0 ? hashtags.join(" ") : "";
  const fullText = caption.includes("#") ? caption : `${caption}\n\n${hashtagsString}`;

  return (
    <div className="w-full max-w-xl mx-auto bg-[#1b1f23] text-gray-100 rounded-xl border border-gray-700/80 shadow-2xl overflow-hidden font-sans">
      {/* LinkedIn Post Header */}
      <div className="p-4 flex items-start justify-between border-b border-gray-800/60">
        <div className="flex items-center space-x-3">
          <img
            src={avatarSrc}
            alt={userName}
            className="w-12 h-12 rounded-full object-cover border border-gray-600 bg-gray-800"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-semibold text-sm text-white hover:underline cursor-pointer">{userName}</h4>
              <span className="text-gray-400 text-xs">• 1st</span>
            </div>
            {userHeadline && (
              <p className="text-xs text-gray-400 line-clamp-1">{userHeadline}</p>
            )}
            <div className="flex items-center space-x-1 text-[11px] text-gray-400 mt-0.5">
              <span>{isPublished ? "Published" : "Draft Preview"}</span>
              <span>•</span>
              <Globe className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="text-gray-400 font-bold hover:text-white cursor-pointer px-2">•••</div>
      </div>

      {/* Post Commentary */}
      <div className="px-4 py-3 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
        {fullText}
      </div>

      {/* Media Attachment (Certificate Preview) */}
      {mediaUrl && (
        <div className="border-y border-gray-800 bg-black/40 overflow-hidden relative group">
          <div className="p-2 bg-gray-900/60 flex items-center justify-between text-xs text-gray-400 px-4 border-b border-gray-800">
            <span className="font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-400" /> {mediaTitle}
            </span>
            <span className="text-[10px] text-gray-500 uppercase">Verified Document</span>
          </div>
          <img
            src={mediaUrl}
            alt="Certificate Document"
            className="w-full max-h-80 object-contain mx-auto py-2 bg-black/80"
          />
        </div>
      )}

      {/* Social Engagement Stats (only if published) */}
      {isPublished && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-400 border-b border-gray-800/80">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <ThumbsUp className="w-2.5 h-2.5" />
            </div>
            <span>Live on LinkedIn</span>
          </div>
        </div>
      )}

      {/* LinkedIn Action Buttons */}
      <div className="px-2 py-1.5 flex items-center justify-around text-xs font-semibold text-gray-400">
        <button className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-gray-800/80 hover:text-white transition-colors">
          <ThumbsUp className="w-4 h-4 text-gray-400" />
          <span>Like</span>
        </button>
        <button className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-gray-800/80 hover:text-white transition-colors">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span>Comment</span>
        </button>
        <button className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-gray-800/80 hover:text-white transition-colors">
          <Repeat2 className="w-4 h-4 text-gray-400" />
          <span>Repost</span>
        </button>
        <button className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-gray-800/80 hover:text-white transition-colors">
          <Send className="w-4 h-4 text-gray-400" />
          <span>Send</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="bg-blue-950/40 border-t border-blue-900/60 p-2.5 text-center text-xs text-blue-300 flex items-center justify-center space-x-1.5">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span>Review carefully before publishing. This post will be shared directly to your LinkedIn feed.</span>
      </div>
    </div>
  );
}
