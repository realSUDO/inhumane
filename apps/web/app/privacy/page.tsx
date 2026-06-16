export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-6">Last updated: June 16, 2026</p>

      <section className="space-y-4 text-gray-700">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>When you sign in with Google, we collect your name, email address, and profile picture. When you connect Gmail or Google Calendar, we access your email and calendar data solely to provide the services you request.</p>

        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>We use your information to authenticate you, execute actions you request (reading emails, creating calendar events), and display relevant data in the app. We do not sell your data.</p>

        <h2 className="text-xl font-semibold">3. Data Storage</h2>
        <p>Your authentication tokens are encrypted and stored securely. We store conversation history to provide continuity. Your data is stored on servers within our infrastructure.</p>

        <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
        <p>We use Google APIs to access Gmail and Google Calendar on your behalf. We use OpenAI/Groq for AI processing. We do not share your personal data with other third parties.</p>

        <h2 className="text-xl font-semibold">5. Data Deletion</h2>
        <p>You can request deletion of your account and all associated data by contacting us at privacy@inhumane.in.</p>

        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>For questions about this policy, contact us at privacy@inhumane.in.</p>
      </section>
    </main>
  );
}
