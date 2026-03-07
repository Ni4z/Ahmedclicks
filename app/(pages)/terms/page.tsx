export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-8">
        <div>
          <p className="text-sm tracking-[0.3em] uppercase text-accent-gold mb-3">
            Terms
          </p>
          <h1 className="text-5xl font-serif font-bold">Terms of Use</h1>
        </div>

        <p className="text-gray-300">
          All photography, written content, and branding on this website are presented
          for portfolio and informational purposes unless otherwise stated.
        </p>

        <section className="space-y-3">
          <h2 className="text-2xl font-serif font-bold">Copyright</h2>
          <p className="text-gray-400">
            Images and text remain the property of NiazClicks or their
            respective owners. Reuse, redistribution, or commercial use requires
            permission from the rights holder.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-serif font-bold">External Links</h2>
          <p className="text-gray-400">
            This website may link to third-party services such as social networks or
            email providers. NiazClicks is not responsible for the content or
            policies of those external services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-serif font-bold">Availability</h2>
          <p className="text-gray-400">
            The site is provided as-is. Content, features, and availability may change
            without prior notice.
          </p>
        </section>
      </div>
    </div>
  );
}
