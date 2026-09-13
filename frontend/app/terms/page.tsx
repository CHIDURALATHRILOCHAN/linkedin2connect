export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
      <p className="text-xs text-gray-400">Last updated: September 2026</p>

      <div className="space-y-4 text-sm text-gray-300 leading-relaxed glass-panel p-8 rounded-2xl border border-gray-800">
        <h3 className="font-bold text-white text-base">1. User Agreement</h3>
        <p>
          By using Achievement2LinkedIn, you agree to comply with all LinkedIn API terms and Community Guidelines. You are responsible for ensuring that all uploaded certificates and published content are authentic.
        </p>

        <h3 className="font-bold text-white text-base pt-2">2. Explicit User Consent</h3>
        <p>
          Achievement2LinkedIn will never publish posts to your LinkedIn profile without your explicit review, approval, and publication request.
        </p>

        <h3 className="font-bold text-white text-base pt-2">3. Limitation of Liability</h3>
        <p>
          The service is provided "as is". Achievement2LinkedIn is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation.
        </p>
      </div>
    </div>
  );
}
