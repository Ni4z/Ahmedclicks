import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Prints & Licensing | NiazPhotography',
  description:
    'Fine art print enquiries and image licensing information for selected photographs from NiazPhotography.',
};

const printOptions = [
  {
    title: 'Fine Art Prints',
    description:
      'Selected photographs can be discussed as wall prints for home, studio, or office spaces. Sizes, finish, and presentation can be tailored after enquiry.',
    details: ['Open-edition and select statement pieces', 'Best suited for framed display or clean modern interiors', 'Available by direct enquiry'],
  },
  {
    title: 'Licensing',
    description:
      'Images can also be discussed for editorial, digital, or brand use when the fit is right. Licensing depends on usage type, duration, placement, and exclusivity.',
    details: ['Editorial and web usage conversations', 'Creative campaigns and project-specific usage', 'Non-exclusive and custom terms depending on the brief'],
  },
];

const enquiryChecklist = [
  'The photo title or page link',
  'Whether the request is for a print or license',
  'Intended usage, placement, or project type',
  'Preferred size or format if it is a print',
  'Timeline and any deadline if usage is commercial or editorial',
];

const emailSubject = encodeURIComponent('Print or licensing enquiry');
const emailHref = `mailto:${siteConfig.contactEmail}?subject=${emailSubject}`;

export default function PrintsPage() {
  return (
    <div className="min-h-screen bg-dark">
      <div className="bg-dark-secondary px-6 py-20 text-center">
        <h1 className="mb-4 text-5xl font-serif font-bold md:text-7xl">
          Prints & Licensing
        </h1>
        <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-400">
          A small, direct page for print enquiries and image licensing. If a
          photograph feels right for your wall, article, or project, this is
          the best place to start the conversation.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-20">
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-14">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold md:text-4xl">
              What You Can Enquire About
            </h2>
            <p className="max-w-3xl text-base leading-8 text-gray-400 lg:text-justify">
              The site is built first as a portfolio, but some photographs are
              also suitable for print display or licensed usage. Rather than
              turning the archive into a store, the process stays direct and
              personal: you send the image you are interested in and the kind
              of use you have in mind, and the discussion can start from there.
            </p>
            <p className="max-w-3xl text-base leading-8 text-gray-400 lg:text-justify">
              This works especially well for individual prints, editorial use,
              website features, and project-based licensing where the context
              matters more than a fixed one-size-fits-all checkout flow.
            </p>
          </div>

          <aside className="rounded-3xl border border-dark-tertiary bg-dark-secondary p-8">
            <p className="mb-3 text-xs uppercase tracking-[0.32em] text-accent-gold">
              Quick Enquiry
            </p>
            <h2 className="mb-4 text-3xl font-serif font-bold">
              Start With the Photo
            </h2>
            <p className="mb-6 leading-7 text-gray-400">
              The fastest way is to send the image title or page link along
              with whether you are asking about a print or a license.
            </p>
            <div className="flex flex-col gap-3">
              <a href={emailHref} className="btn-primary text-center">
                Email an Enquiry
              </a>
              <Link href="/contact" className="btn-secondary text-center">
                Open Contact Page
              </Link>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm tracking-[0.22em] uppercase text-accent-gold hover:underline"
              >
                Message on Instagram
              </a>
            </div>
          </aside>
        </section>

        <section className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2">
          {printOptions.map((option) => (
            <div
              key={option.title}
              className="rounded-3xl border border-dark-tertiary bg-dark-secondary p-8"
            >
              <h2 className="mb-4 text-3xl font-serif font-bold">
                {option.title}
              </h2>
              <p className="mb-6 leading-8 text-gray-400 lg:text-justify">
                {option.description}
              </p>
              <ul className="space-y-3 text-sm leading-7 text-gray-400">
                {option.details.map((detail) => (
                  <li key={detail} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-gold" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-20 rounded-3xl border border-dark-tertiary bg-dark-secondary p-8 md:p-10">
          <p className="mb-3 text-xs uppercase tracking-[0.32em] text-accent-gold">
            What to Include
          </p>
          <h2 className="mb-6 text-3xl font-serif font-bold md:text-4xl">
            Helpful Details in Your Message
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {enquiryChecklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-dark-tertiary px-5 py-4 text-gray-400"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
