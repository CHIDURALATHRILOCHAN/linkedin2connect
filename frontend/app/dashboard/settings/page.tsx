"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Linkedin, ShieldCheck, Trash2, User as UserIcon, Lock, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user, linkedInStatus, refreshLinkedInStatus } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const handleConnectLinkedIn = async () => {
    try {
      const res = await apiRequest<{ authorization_url: string }>("/linkedin/connect");
      window.location.href = res.authorization_url;
    } catch (err: any) {
      alert(`LinkedIn OAuth Request Failed: ${err.message}`);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!confirm("Are you sure you want to disconnect your LinkedIn account?")) return;
    try {
      await apiRequest("/linkedin/disconnect", { method: "POST" });
      await refreshLinkedInStatus();
      setMessage("LinkedIn account disconnected successfully.");
    } catch (err: any) {
      alert(err.message || "Disconnect failed.");
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm("CAUTION: This will permanently delete all your uploaded certificates, OCR data, and post records. Proceed?")) return;
    setDeleting(true);
    try {
      const res = await apiRequest<{ message: string }>("/admin/delete-all-data", { method: "DELETE" });
      setMessage(res.message);
    } catch (err: any) {
      alert(err.message || "Deletion failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-sm text-gray-400">Manage profile, LinkedIn connection authorization, and data privacy.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Info */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-blue-400" />
          <span>User Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Full Name</label>
            <input
              type="text"
              readOnly
              value={user?.name || ""}
              className="w-full bg-dark-bg border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || ""}
              className="w-full bg-dark-bg border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* LinkedIn Connection */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border-blue-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <Linkedin className="w-4 h-4 text-blue-400" />
            <span>LinkedIn Official Authorization</span>
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              linkedInStatus.connected
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : "bg-amber-950 text-amber-300 border border-amber-800"
            }`}
          >
            {linkedInStatus.connected ? "Connected" : "Not Connected"}
          </span>
        </div>

        {linkedInStatus.connected ? (
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-dark-bg rounded-xl border border-gray-800 flex items-center space-x-3">
              {linkedInStatus.member_picture && (
                <img
                  src={linkedInStatus.member_picture}
                  alt="Member"
                  className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                />
              )}
              <div>
                <p className="text-sm font-semibold text-white">Connected as {linkedInStatus.member_name}</p>
                <p className="text-xs text-gray-400">Member ID: {linkedInStatus.linkedin_member_id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleConnectLinkedIn}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold"
              >
                Reconnect LinkedIn
              </button>

              <button
                onClick={handleDisconnectLinkedIn}
                className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-xl text-xs font-semibold"
              >
                Disconnect Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-gray-300 leading-relaxed">
              Connect your LinkedIn account using official OAuth 2.0 to enable 1-click publishing of your certificate posts.
            </p>
            <button
              onClick={handleConnectLinkedIn}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20"
            >
              Connect Official LinkedIn Account
            </button>
          </div>
        )}
      </div>

      {/* Data Management / Privacy */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border-red-900/30">
        <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center space-x-2">
          <Trash2 className="w-4 h-4" />
          <span>Data Management & Privacy</span>
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Permanently erase all your uploaded certificate files, extracted OCR JSON data, and generated post histories from our servers.
        </p>

        <button
          onClick={handleDeleteAllData}
          disabled={deleting}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50"
        >
          {deleting ? "Deleting data..." : "Delete All My Achievements & Data"}
        </button>
      </div>
    </div>
  );
}
