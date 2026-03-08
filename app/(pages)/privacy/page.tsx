export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-8">
        <div>
          <p className="text-sm tracking-[0.3em] uppercase text-accent-gold mb-3">
            Privacy
          </p>
          <h1 className="text-5xl font-serif font-bold">Privacy Policy</h1>
        </div>

        <p className="text-gray-300">
          This portfolio is a static website. It does not run a database or collect
          personal data directly unless you choose to contact NiazPhotography through one
          of the links on the site.
        </p>

        <section className="space-y-3">
          <h2 className="text-2xl font-serif font-bold">Information You Share</h2>
          <p className="text-gray-400">
            If you contact NiazPhotography by email, the information you include in that email
            is used only to respond to your inquiry or continue the conversation you
            started.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-serif font-bold">Analytics</h2>
          <p className="text-gray-400">
            Analytics are only enabled if a valid tracking ID is configured for the
            site. If enabled, analytics providers may collect standard usage data
            such as page views, browser type, and referral information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-serif font-bold">Third-Party Content</h2>
          <p className="text-gray-400">
            Some images and external links may be served from third-party platforms.
            Those providers may apply their own privacy policies and cookie behavior.
          </p>
        </section>
      </div>
    </div>
  );
}
