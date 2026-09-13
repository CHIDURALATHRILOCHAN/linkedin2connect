"use client";

import Link from "next/link";
import {
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Upload,
  Bot,
  FileCheck2,
  Share2,
  Lock,
  Zap,
  HelpCircle,
  Linkedin
} from "lucide-react";
import LinkedInPreview from "@/components/LinkedInPreview";

export default function LandingPage() {
  const supportedAchievements = [
    { title: "Certifications", desc: "AWS, Azure, Google, Stanford, Coursera" },
    { title: "Course Completion", desc: "Specialization & Deep Learning Certificates" },
    { title: "Hackathons", desc: "1st Place Winner & Global Finalist Recognitions" },
    { title: "Internships", desc: "Software Engineering & Industry Experience" },
    { title: "Awards", desc: "Company Excellence & Employee of the Month" },
    { title: "Workshops", desc: "Technical Bootcamps & Hands-on Labs" },
    { title: "Competitions", desc: "Kaggle, Codeforces & Open Source Milestones" },
    { title: "Research Achievements", desc: "Paper Publications & Conference Presentations" },
    { title: "Training Programs", desc: "Executive Leadership & Tech Credentials" },
    { title: "Other Achievements", desc: "Patents, Keynotes & Career Accomplishments" },
  ];

  const faqs = [
    {
      q: "Do you ever ask for my LinkedIn password?",
      a: "Never. We strictly use official LinkedIn OAuth 2.0 authorization. You log in directly on LinkedIn's official domain and grant member posting permission."
    },
    {
      q: "Can I edit the AI-generated post before it gets published?",
      a: "Yes, 100%. The system never posts automatically without your explicit 'Approve & Publish' action. You can refine the caption, hashtags, and tone."
    },
    {
      q: "What file formats are supported for certificate upload?",
      a: "We support PNG, JPG, JPEG, and PDF documents up to 10MB."
    },
    {
      q: "How does the OCR document processing work?",
      a: "Our AI document understanding engine extracts recipient names, issuing organizations, dates, skills, and certificate IDs, allowing you to review and verify every detail."
    }
  ];

  return (
    <div className="space-y-24 py-6">
      {/* HERO SECTION */}
      <section className="relative text-center max-w-4xl mx-auto space-y-8 pt-8">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold shadow-lg backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Powered by OCR AI & Official LinkedIn REST APIs</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Turn Your Achievements Into{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Professional LinkedIn Posts
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Upload a certificate or achievement. Let AI extract the details, create a professional LinkedIn post, and publish it to your profile.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-base font-bold shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-4 bg-dark-card border border-gray-700 hover:bg-gray-800 text-gray-200 rounded-xl text-base font-semibold transition-all flex items-center justify-center"
          >
            How It Works
          </a>
        </div>

        {/* Security Micro Badge */}
        <div className="pt-4 flex items-center justify-center space-x-6 text-xs text-gray-400 font-medium">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Zero LinkedIn Passwords Needed</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Official OAuth 2.0 API</span>
          </div>
        </div>
      </section>

      {/* SAMPLE LINKEDIN POST PREVIEW */}
      <section className="max-w-3xl mx-auto space-y-4">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Realistic LinkedIn Feed Output</span>
          <h2 className="text-2xl font-bold text-white">What Your Published Post Looks Like</h2>
        </div>
        <LinkedInPreview
          userName="Jane Doe"
          userHeadline="Senior AI & Full Stack Architect"
          caption={`I am thrilled to announce that I have officially completed the 'Advanced Machine Learning & AI Engineering Specialist' certification issued by Stanford Online & DeepLearning.AI! 🎓\n\nThroughout this intensive program, I deepened my technical expertise in PyTorch, Transformer Architectures, and MLOps pipelines. Exciting times ahead applying these capabilities!`}
          hashtags={["#MachineLearning", "#AI", "#ContinuousLearning", "#StanfordOnline"]}
          mediaUrl="https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&auto=format&fit=crop&q=80"
          mediaTitle="Stanford AI Specialist Certificate"
        />
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="space-y-12 max-w-6xl mx-auto">
        <div className="text-center space-y-3">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Automated Workflow</span>
          <h2 className="text-3xl font-extrabold text-white">4 Simple Steps From Certificate to Feed</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4 relative group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">1. Upload Certificate</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Upload your JPG, PNG, or PDF certificate or achievement award securely.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4 relative group">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">2. AI Extraction</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              OCR AI parses recipient name, issuer, dates, skills, and award credentials.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4 relative group">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">3. Review & Edit</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Verify extracted data, choose AI post variations, and refine the tone.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4 relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">4. Approve & Publish</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Click approve and watch your media post land live on LinkedIn via official APIs.
            </p>
          </div>
        </div>
      </section>

      {/* SUPPORTED ACHIEVEMENTS */}
      <section className="space-y-8 bg-dark-card/60 border border-gray-800/80 p-8 rounded-3xl max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Supported Credentials</span>
          <h2 className="text-3xl font-extrabold text-white">Works With Any Achievement</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {supportedAchievements.map((item, idx) => (
            <div key={idx} className="p-4 bg-dark-bg/80 border border-gray-800 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-gray-400 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-blue-400 mx-auto" />
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl space-y-2">
              <h3 className="font-bold text-white text-base">{faq.q}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="text-center max-w-4xl mx-auto p-10 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-3xl space-y-6 shadow-2xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready To Showcase Your Career Milestones?</h2>
        <p className="text-gray-300 text-base max-w-xl mx-auto">
          Join professionals using AI and official LinkedIn integration to build their personal brand effortlessly.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
        >
          <span>Create Free Account</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
