"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import LinkedInPreview from "@/components/LinkedInPreview";
import PostEditor from "@/components/PostEditor";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Linkedin,
  Share2,
  FileCheck,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

interface Achievement {
  id: string;
  original_file_url: string;
  file_name: string;
  file_type: string;
  extracted_data: any;
  verified_data: any;
  achievement_type: string;
  processing_status: string;
  extra_responses: any;
}

interface PostData {
  id: string;
  achievement_id: string;
  caption: string;
  hashtags: string[];
  tone: string;
  post_variations: any[];
  status: string;
  linkedin_post_id?: string;
  linkedin_post_url?: string;
}

export default function AchievementWorkspacePage() {
  const { id } = useParams() as { id: string };
  const { user, linkedInStatus } = useAuth();
  const router = useRouter();

  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [step, setStep] = useState<number>(1); // 1: Verify Data, 2: Extra Questions, 3: AI Post Options, 4: Preview & Publish
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<PostData | null>(null);
  const [error, setError] = useState("");

  // Verification Form State
  const [recipientName, setRecipientName] = useState("");
  const [achievementTitle, setAchievementTitle] = useState("");
  const [issuingOrg, setIssuingOrg] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [achievementType, setAchievementType] = useState("Certification");
  const [skillsStr, setSkillsStr] = useState("");
  const [description, setDescription] = useState("");

  // Dynamic Questions State
  const [extraQuestion1, setExtraQuestion1] = useState("");
  const [extraQuestion2, setExtraQuestion2] = useState("");

  // Post Generator State
  const [postData, setPostData] = useState<PostData | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tone, setTone] = useState("Professional");

  useEffect(() => {
    fetchAchievementDetails();
  }, [id]);

  const fetchAchievementDetails = async () => {
    try {
      const data = await apiRequest<Achievement>(`/achievements/${id}`);
      setAchievement(data);

      const v = data.verified_data || data.extracted_data || {};
      setRecipientName(v.recipient_name || user?.name || "");
      setAchievementTitle(v.achievement_title || "");
      setIssuingOrg(v.issuing_organization || "");
      setIssueDate(v.issue_date || "");
      setCertificateId(v.certificate_id || "");
      setAchievementType(data.achievement_type || v.achievement_type || "Certification");
      setSkillsStr(v.skills ? v.skills.join(", ") : "");
      setDescription(v.description || "");

      // If draft post exists, pre-load
      fetchPostForAchievement();
    } catch (err: any) {
      setError(err.message || "Failed to load achievement.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPostForAchievement = async () => {
    try {
      const postsList = await apiRequest<PostData[]>("/posts");
      const existing = postsList.find((p) => p.achievement_id === id);
      if (existing) {
        setPostData(existing);
        setCaption(existing.caption);
        setHashtags(existing.hashtags || []);
        setTone(existing.tone || "Professional");
        if (existing.status === "PUBLISHED") {
          setPublishSuccess(existing);
        }
      }
    } catch (err) {
      console.error("No existing post found yet");
    }
  };

  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const skillsArray = skillsStr.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
      const verifiedPayload = {
        recipient_name: recipientName,
        achievement_title: achievementTitle,
        issuing_organization: issuingOrg,
        issue_date: issueDate,
        certificate_id: certificateId,
        achievement_type: achievementType,
        skills: skillsArray,
        description: description,
        extra_responses: {
          q1: extraQuestion1,
          q2: extraQuestion2
        }
      };

      const updated = await apiRequest<Achievement>(`/achievements/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify(verifiedPayload),
      });

      setAchievement(updated);
      setStep(2); // Proceed to optional questions
    } catch (err: any) {
      setError(err.message || "Failed to save verification.");
    }
  };

  const handleGeneratePosts = async (selectedTone: string = tone) => {
    setIsGenerating(true);
    setError("");

    try {
      const postResponse = await apiRequest<PostData>("/posts/generate", {
        method: "POST",
        body: JSON.stringify({
          achievement_id: id,
          tone: selectedTone,
        }),
      });

      setPostData(postResponse);
      setCaption(postResponse.caption);
      setHashtags(postResponse.hashtags || []);
      setTone(selectedTone);
      setStep(3); // Proceed to Post Variations & Editor
    } catch (err: any) {
      setError(err.message || "AI Post generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishPost = async () => {
    if (!postData) return;
    setIsPublishing(true);
    setError("");

    try {
      // First update current caption & hashtags if modified
      await apiRequest(`/posts/${postData.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          caption,
          hashtags,
          tone
        })
      });

      // Execute LinkedIn publication
      const published = await apiRequest<PostData>(`/posts/${postData.id}/publish`, {
        method: "POST"
      });

      setPublishSuccess(published);
      setShowPublishModal(false);
    } catch (err: any) {
      setError(err.message || "Publishing to LinkedIn failed.");
      setShowPublishModal(false);
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading achievement workspace...</p>
      </div>
    );
  }

  // Published Success View
  if (publishSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Post Published Successfully!</h1>
        <p className="text-sm text-gray-300">
          Your achievement post with certificate media has been posted to your authenticated LinkedIn profile feed.
        </p>

        {publishSuccess.linkedin_post_url && (
          <div className="p-4 glass-panel rounded-xl border border-blue-500/40 inline-flex items-center space-x-2 text-sm text-blue-300">
            <span>LinkedIn Post Reference:</span>
            <a
              href={publishSuccess.linkedin_post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-white hover:text-blue-400 flex items-center space-x-1"
            >
              <span>View Live Post</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        <div className="pt-4 flex items-center justify-center space-x-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm rounded-xl"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/dashboard/achievements/new")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl"
          >
            + Create Another Achievement
          </button>
        </div>
      </div>
    );
  }

  const confidence = achievement?.extracted_data?.confidence || {};

  return (
    <div className="space-y-8">
      {/* Workspace Stepper Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Achievement Creator Workspace</h1>
          <p className="text-xs text-gray-400">Step {step} of 4: {step === 1 ? "Verify Extracted Data" : step === 2 ? "Additional Context" : step === 3 ? "Select Post Option" : "Preview & Publish"}</p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium">
          <span className={`px-3 py-1 rounded-full ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"}`}>1. Verify</span>
          <span>→</span>
          <span className={`px-3 py-1 rounded-full ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"}`}>2. Context</span>
          <span>→</span>
          <span className={`px-3 py-1 rounded-full ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"}`}>3. Post Editor</span>
          <span>→</span>
          <span className={`px-3 py-1 rounded-full ${step >= 4 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"}`}>4. LinkedIn Preview</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Side-by-side Human Verification */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Certificate Preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Original Certificate Document</span>
            </h3>
            <div className="glass-panel p-4 rounded-2xl border border-gray-800 overflow-hidden bg-black/60 text-center">
              {achievement?.original_file_url ? (
                <img
                  src={achievement.original_file_url}
                  alt="Certificate Preview"
                  className="w-full max-h-[500px] object-contain rounded-xl mx-auto shadow-lg"
                />
              ) : (
                <div className="py-20 text-gray-500">Document preview unavailable.</div>
              )}
            </div>
          </div>

          {/* Right Column: Extracted Information Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Extracted Information</h3>
              <span className="text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                Please verify highlighted fields
              </span>
            </div>

            <form onSubmit={handleSaveVerification} className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label className="font-semibold text-gray-300">Recipient Name</label>
                  {confidence.recipient_name && (
                    <span className="text-gray-500">Confidence: {(confidence.recipient_name * 100).toFixed(0)}%</span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-dark-input border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label className="font-semibold text-gray-300">Achievement Title</label>
                  {confidence.achievement_title && (
                    <span className="text-gray-500">Confidence: {(confidence.achievement_title * 100).toFixed(0)}%</span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={achievementTitle}
                  onChange={(e) => setAchievementTitle(e.target.value)}
                  className="w-full bg-dark-input border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Issuing Organization</label>
                  <input
                    type="text"
                    required
                    value={issuingOrg}
                    onChange={(e) => setIssuingOrg(e.target.value)}
                    className="w-full bg-dark-input border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Issue Date</label>
                  <input
                    type="text"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full bg-dark-input border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Certificate ID</label>
                  <input
                    type="text"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="Credential ID"
                    className="w-full bg-dark-input border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Achievement Type</label>
                  <select
                    value={achievementType}
                    onChange={(e) => setAchievementType(e.target.value)}
                    className="w-full bg-dark-input border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Certification">Certification</option>
                    <option value="Course">Course Completion</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Internship">Internship</option>
                    <option value="Award">Award</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Research">Research Paper</option>
                    <option value="Other">Other Achievement</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="AWS, Machine Learning, Python"
                  className="w-full bg-dark-input border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Confirm Information & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: Optional Dynamic Questions */}
      {step === 2 && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Add Extra Details (Optional)</h2>
            <p className="text-xs text-gray-400">
              Provide context to make your LinkedIn post more authentic and engaging.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            {achievementType === "Hackathon" ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">What was your project name and key tech stack?</label>
                  <input
                    type="text"
                    value={extraQuestion1}
                    onChange={(e) => setExtraQuestion1(e.target.value)}
                    placeholder="e.g. Agentic AI workflow tool using FastAPI & React"
                    className="w-full bg-dark-input border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">What was your role or main contribution?</label>
                  <input
                    type="text"
                    value={extraQuestion2}
                    onChange={(e) => setExtraQuestion2(e.target.value)}
                    placeholder="e.g. Full Stack Architect & LLM Integration Lead"
                    className="w-full bg-dark-input border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : achievementType === "Internship" ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">What projects did you work on during the internship?</label>
                  <input
                    type="text"
                    value={extraQuestion1}
                    onChange={(e) => setExtraQuestion1(e.target.value)}
                    placeholder="e.g. Scaled backend API infrastructure for 100k active users"
                    className="w-full bg-dark-input border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">What was the single biggest takeaway or skill learned?</label>
                  <input
                    type="text"
                    value={extraQuestion1}
                    onChange={(e) => setExtraQuestion1(e.target.value)}
                    placeholder="e.g. Designing fault-tolerant distributed cloud microservices"
                    className="w-full bg-dark-input border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => handleGeneratePosts("Professional")}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Skip Question
              </button>

              <button
                type="button"
                onClick={() => handleGeneratePosts("Professional")}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg flex items-center space-x-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Posts with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-300" />
                    <span>Generate AI LinkedIn Posts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AI Post Variations & Rich Editor */}
      {step === 3 && postData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>AI Post Generator & Editor</span>
            </h2>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm shadow-md flex items-center space-x-2"
            >
              <span>Proceed to LinkedIn Preview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <PostEditor
            variations={postData.post_variations || []}
            currentCaption={caption}
            currentHashtags={hashtags}
            currentTone={tone}
            onChangeCaption={setCaption}
            onChangeHashtags={setHashtags}
            onChangeTone={setTone}
            onRegenerate={handleGeneratePosts}
            isGenerating={isGenerating}
          />
        </div>
      )}

      {/* STEP 4: LinkedIn Preview & Publish Modal trigger */}
      {step === 4 && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Linkedin className="w-5 h-5 text-blue-500" />
              <span>Realistic LinkedIn Feed Preview</span>
            </h2>
            <button
              onClick={() => setStep(3)}
              className="text-xs text-blue-400 hover:underline font-semibold"
            >
              ← Edit Caption
            </button>
          </div>

          <LinkedInPreview
            userName={recipientName || user?.name || "Member"}
            caption={caption}
            hashtags={hashtags}
            mediaUrl={achievement?.original_file_url}
            mediaTitle={achievementTitle}
            isPublished={postData?.status === "PUBLISHED"}
          />

          <div className="glass-panel p-6 rounded-2xl space-y-4 text-center border-blue-500/30">
            <h3 className="text-base font-bold text-white">Ready To Publish?</h3>
            <p className="text-xs text-gray-300 max-w-md mx-auto">
              Your post and certificate document will be published live to your connected LinkedIn profile using official LinkedIn REST APIs.
            </p>

            <button
              onClick={() => setShowPublishModal(true)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base rounded-xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Share2 className="w-5 h-5" />
              <span>Approve & Publish To LinkedIn</span>
            </button>
          </div>
        </div>
      )}

      {/* EXPLICIT PUBLISH CONFIRMATION MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-card border border-gray-700 max-w-md w-full rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center space-x-3 text-blue-400">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <Linkedin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirm LinkedIn Publication</h3>
                <p className="text-xs text-gray-400">Official LinkedIn Post Request</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              You are about to publish this achievement and certificate media to your public LinkedIn profile feed.
            </p>

            <div className="p-3 bg-dark-bg rounded-xl border border-gray-800 text-xs text-gray-400 space-y-1">
              <p>• Account: <span className="text-white font-semibold">{linkedInStatus.member_name || user?.name}</span></p>
              <p>• Visibility: <span className="text-white font-semibold">Public LinkedIn Feed</span></p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handlePublishPost}
                disabled={isPublishing}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Confirm & Publish</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
