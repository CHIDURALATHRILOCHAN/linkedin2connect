"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, Hash, Check, Wand2 } from "lucide-react";

interface Variation {
  option_id: number;
  title: string;
  tone: string;
  caption: string;
  hashtags: string[];
  suggested_skills: string[];
}

interface PostEditorProps {
  variations: Variation[];
  currentCaption: string;
  currentHashtags: string[];
  currentTone: string;
  onChangeCaption: (newCaption: string) => void;
  onChangeHashtags: (newHashtags: string[]) => void;
  onChangeTone: (newTone: string) => void;
  onRegenerate: (tone: string) => void;
  isGenerating: boolean;
}

export default function PostEditor({
  variations,
  currentCaption,
  currentHashtags,
  currentTone,
  onChangeCaption,
  onChangeHashtags,
  onChangeTone,
  onRegenerate,
  isGenerating
}: PostEditorProps) {
  const [tagInput, setTagInput] = useState("");

  const maxChars = 3000;
  const charCount = currentCaption.length;

  const handleAddHashtag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    let formatted = tagInput.trim();
    if (!formatted.startsWith("#")) formatted = `#${formatted}`;
    if (!currentHashtags.includes(formatted)) {
      onChangeHashtags([...currentHashtags, formatted]);
    }
    setTagInput("");
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    onChangeHashtags(currentHashtags.filter((t) => t !== tagToRemove));
  };

  const handleSelectOption = (v: Variation) => {
    onChangeCaption(v.caption);
    onChangeHashtags(v.hashtags);
    onChangeTone(v.tone);
  };

  return (
    <div className="space-y-6">
      {/* Variations Selection Cards */}
      {variations && variations.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Select AI Post Variation</span>
            <span className="text-blue-400 text-[11px] font-normal">3 Options Generated</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {variations.map((v) => {
              const isSelected = currentCaption === v.caption;
              return (
                <div
                  key={v.option_id}
                  onClick={() => handleSelectOption(v)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10"
                      : "bg-dark-card border-gray-800 hover:border-gray-700 hover:bg-dark-card/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white line-clamp-1">{v.title}</span>
                      {isSelected ? (
                        <span className="flex items-center text-[10px] text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-500/30">
                          <Check className="w-3 h-3 mr-0.5" /> Selected
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed mb-3">
                      {v.caption}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-[10px] text-gray-400">
                    <span className="bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 font-medium">{v.tone}</span>
                    <span className="text-blue-400 font-medium">{v.hashtags ? `${v.hashtags.length} Tags` : "Reach Optimized"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Textarea Caption Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Post Caption
          </label>
          <div className="flex items-center space-x-3">
            {/* Tone Selector */}
            <select
              value={currentTone}
              onChange={(e) => {
                onChangeTone(e.target.value);
                onRegenerate(e.target.value);
              }}
              disabled={isGenerating}
              className="bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-200 px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="Professional">Tone: Professional</option>
              <option value="Engaging">Tone: Engaging</option>
              <option value="Short">Tone: Short</option>
              <option value="Technical">Tone: Technical</option>
              <option value="Humble">Tone: Humble</option>
            </select>

            <button
              type="button"
              onClick={() => onRegenerate(currentTone)}
              disabled={isGenerating}
              className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={currentCaption}
            onChange={(e) => onChangeCaption(e.target.value)}
            rows={8}
            className="w-full bg-dark-input border border-gray-700 rounded-xl p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed"
            placeholder="Write or fine-tune your LinkedIn post..."
          />
          <div className="absolute bottom-3 right-4 text-[11px] text-gray-400 font-mono">
            {charCount} / {maxChars}
          </div>
        </div>
      </div>

      {/* Hashtag Manager */}
      <div className="space-y-3 bg-dark-card p-4 rounded-xl border border-gray-800">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between">
          <span>Hashtags & Keywords</span>
          <span className="text-gray-500 text-[11px] font-normal">{currentHashtags.length} tags</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {currentHashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-950/50 border border-blue-800/60 rounded-full text-xs text-blue-300"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveHashtag(tag)}
                className="hover:text-red-400 ml-1 text-blue-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddHashtag} className="flex space-x-2 pt-2">
          <div className="relative flex-1">
            <Hash className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add hashtag (e.g. MachineLearning)"
              className="w-full bg-dark-bg border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-medium text-white rounded-lg transition-colors"
          >
            Add Tag
          </button>
        </form>
      </div>
    </div>
  );
}
