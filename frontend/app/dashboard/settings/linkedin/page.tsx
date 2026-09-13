"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, AlertCircle, Linkedin } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshLinkedInStatus } = useAuth();

  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  useEffect(() => {
    if (connected === "true") {
      refreshLinkedInStatus();
      const timer = setTimeout(() => {
        router.push("/dashboard/settings");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [connected]);

  return (
    <div className="space-y-6">
      {connected === "true" ? (
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 text-emerald-400 font-bold text-lg">
            <CheckCircle2 className="w-6 h-6" />
            <span>LinkedIn Connected Successfully!</span>
          </div>
          <p className="text-xs text-gray-400">Redirecting to your settings page...</p>
        </div>
      ) : error ? (
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 text-red-400 font-bold text-lg">
            <AlertCircle className="w-6 h-6" />
            <span>LinkedIn Connection Failed</span>
          </div>
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-semibold"
          >
            Back to Settings
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Completing LinkedIn authorization...</p>
        </div>
      )}
    </div>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400 mx-auto">
        <Linkedin className="w-8 h-8" />
      </div>

      <Suspense fallback={
        <div className="space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading callback...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
