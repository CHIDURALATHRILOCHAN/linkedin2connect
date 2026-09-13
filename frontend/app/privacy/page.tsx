export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="text-xs text-gray-400">Last updated: September 2026</p>

      <div className="space-y-4 text-sm text-gray-300 leading-relaxed glass-panel p-8 rounded-2xl border border-gray-800">
        <h3 className="font-bold text-white text-base">1. Information We Collect</h3>
        <p>
          Achievement2LinkedIn collects user registration details (name, email address, password hash) and uploaded achievement documents (certificates, course completions, awards).
        </p>

        <h3 className="font-bold text-white text-base pt-2">2. How Certificate Data is Processed</h3>
        <p>
          Uploaded documents are analyzed using OCR/document understanding AI solely to extract structured achievement details (recipient name, issuing organization, dates, skills). We do not sell or share certificate contents with third parties.
        </p>

        <h3 className="font-bold text-white text-base pt-2">3. LinkedIn Authorization & OAuth Tokens</h3>
        <p>
          We connect to LinkedIn using official OAuth 2.0. We NEVER request or collect your LinkedIn password. Access tokens are encrypted using industry-standard Fernet encryption and stored securely.
        </p>

        <h3 className="font-bold text-white text-base pt-2">4. Data Erasure & Control</h3>
        <p>
          You can disconnect your LinkedIn connection at any time or permanently delete all your uploaded files and generated post records from the Settings tab.
        </p>
      </div>
    </div>
  );
}
