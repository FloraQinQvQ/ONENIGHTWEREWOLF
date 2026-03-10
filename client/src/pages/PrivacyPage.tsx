import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/login" className="text-gray-500 hover:text-gray-300 text-sm">← Back</Link>
      </div>

      <div className="text-4xl mb-3">🔒</div>
      <h1 className="text-3xl font-bold text-white mb-1">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>

      <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-semibold text-base mb-2">Who we are</h2>
          <p>
            One Night Werewolf is a free, browser-based social deduction game. We are not a commercial service
            and do not sell products or advertising. This policy explains what information we collect and why.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">What data we collect</h2>
          <p className="mb-2">When you sign in with Google, we receive and store:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Your Google account ID (used as a unique identifier)</li>
            <li>Your email address (used only to link your account — never shared or emailed)</li>
            <li>Your Google profile name (used as your default display name)</li>
            <li>Your Google profile picture URL (shown as your avatar until you choose an emoji)</li>
          </ul>
          <p className="mt-2">We also store any customisations you choose:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Your custom display name (if you change it)</li>
            <li>Your chosen emoji avatar (if you pick one)</li>
          </ul>
          <p className="mt-2">Game results (who won/lost each round) are stored but contain no personally identifiable information beyond your in-game display name.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Why we collect it</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>To recognise you across sessions so you don't have to set up your profile each time</li>
            <li>To display your name and avatar to other players in the same game room</li>
          </ul>
          <p className="mt-2">We collect the minimum information required to run the game. We do not use your data for advertising, profiling, or analytics.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Cookies</h2>
          <p>
            We use a single session cookie to keep you signed in. This cookie is strictly necessary for the app to function
            and contains no tracking information. It expires when you sign out or after a period of inactivity.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Who can see your data</h2>
          <p>
            Your display name and avatar are visible to other players in the same game room. Your email address and Google ID
            are never shown to other players or any third parties. We do not sell, share, or transfer your data to anyone.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">How long we keep it</h2>
          <p>
            Your account data is kept for as long as you have an account. You can delete your account at any time from
            your profile settings, which permanently removes all your personal data from our database.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Your rights (GDPR)</h2>
          <p className="mb-2">If you are in the European Economic Area, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li><strong className="text-gray-300">Access</strong> — see what data we hold about you (sign in and open your profile)</li>
            <li><strong className="text-gray-300">Rectification</strong> — update your display name and avatar in your profile settings</li>
            <li><strong className="text-gray-300">Erasure</strong> — delete your account and all associated data from your profile settings</li>
            <li><strong className="text-gray-300">Portability</strong> — your data is limited to your name and avatar, which you can see in your profile</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Third-party services</h2>
          <p>
            We use <strong className="text-gray-300">Google OAuth 2.0</strong> for sign-in. When you click "Sign in with Google",
            you are redirected to Google's servers. Google's own privacy policy governs what happens there.
            We only receive the profile information you authorise (name, email, profile picture).
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Contact</h2>
          <p>
            If you have questions about this policy or want to exercise any of your rights, you can delete your account
            directly in the app. For anything else, raise an issue on the project's GitHub repository.
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-white/10">
        <Link to="/login" className="btn-ghost text-sm px-4 py-2">← Back to sign in</Link>
      </div>
    </div>
  );
}
