"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Image as ImageIcon, ShieldCheck } from "lucide-react";

export default function NewAchievementPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (selectedFile: File) => {
    setError("");

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Unsupported file format. Please upload a JPG, PNG, or PDF certificate document.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds maximum limit of 10MB.");
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const achievement = await apiRequest<{ id: string }>("/achievements", {
        method: "POST",
        body: formData,
      });

      router.push(`/dashboard/achievements/${achievement.id}`);
    } catch (err: any) {
      setError(err.message || "File upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-white bg-dark-card border border-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Create New Achievement</h1>
          <p className="text-xs text-gray-400">Upload your certificate document for instant AI OCR analysis.</p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl space-y-6">
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-10 text-center cursor-pointer transition-all bg-dark-bg/60 space-y-4 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">
              {file ? file.name : "Click to upload or drag & drop certificate"}
            </h3>
            <p className="text-xs text-gray-400">Supports JPG, PNG, or PDF up to 10MB</p>
          </div>
        </div>

        {/* File Selected Preview */}
        {file && (
          <div className="p-4 bg-dark-card border border-gray-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-700" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="text-xs text-red-400 hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        {/* Submit Action */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing certificate with AI...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Process Certificate & Extract Data</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Files are stored securely with strict data privacy controls.</span>
        </div>
      </div>
    </div>
  );
}
