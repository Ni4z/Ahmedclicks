import { siteConfig } from '@/lib/site';

interface PhotoSupportCardProps {
  photoTitle: string;
  compact?: boolean;
}

function CoffeeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 9.5h10v3.75a4.25 4.25 0 0 1-4.25 4.25h-1.5A4.25 4.25 0 0 1 5 13.25Z" />
      <path d="M15 10h1.5a2.5 2.5 0 0 1 0 5H15" />
      <path d="M8 6.5c0-.9.5-1.35 1.05-1.85.48-.43.95-.84.95-1.65" />
      <path d="M11 6.5c0-.9.5-1.35 1.05-1.85.48-.43.95-.84.95-1.65" />
      <path d="M4.5 20h12.5" />
    </svg>
  );
}

export default function PhotoSupportCard({
  photoTitle,
  compact = false,
}: PhotoSupportCardProps) {
  const paypalSupportUrl = siteConfig.paypalSupportUrl;
  const previewOnly = !paypalSupportUrl;
  const buttonLabel = compact ? 'Buy me a €1 coffee' : 'Buy me a €1 coffee on PayPal';
  const eyebrow = compact ? 'Support the next frame' : 'A small thank-you';
  const copy = compact
    ? 'If this photo stayed with you, a single euro helps fund the next quiet frame.'
    : 'If this image stayed with you, a single euro helps cover future walks, editing time, and the next photograph shared here.';

  return (
    <div
      className={`rounded-2xl border border-dark-tertiary bg-dark-secondary/90 text-foreground shadow-[0_18px_38px_rgba(0,0,0,0.08)] ${
        compact ? 'mt-3 p-4' : 'mt-6 p-6'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dark-tertiary bg-dark/65 text-foreground/82">
          <CoffeeIcon />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] uppercase tracking-[0.34em] text-foreground/45">
            {eyebrow}
          </p>
          <p className={`mt-2 text-foreground/78 ${compact ? 'text-sm leading-6' : 'text-base leading-7'}`}>
            {copy}
          </p>

          <div className={`mt-4 flex flex-wrap items-center gap-3 ${compact ? '' : 'gap-y-4'}`}>
            {previewOnly ? (
              <span
                aria-disabled="true"
                className="inline-flex items-center justify-center rounded-full border border-dark-tertiary bg-dark/40 px-4 py-2 text-sm font-medium text-foreground/65"
              >
                {buttonLabel}
              </span>
            ) : (
              <a
                href={paypalSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buy Niaz a one euro coffee via PayPal after viewing ${photoTitle}`}
                className="inline-flex items-center justify-center rounded-full border border-foreground/18 bg-foreground/[0.06] px-4 py-2 text-sm font-medium text-foreground transition-colors duration-300 hover:border-foreground/30 hover:bg-foreground/[0.1]"
              >
                {buttonLabel}
              </a>
            )}

            <span className="text-[0.66rem] uppercase tracking-[0.28em] text-foreground/40">
              {previewOnly ? 'Preview only' : 'Via PayPal'}
            </span>
          </div>

          {!compact && previewOnly ? (
            <p className="mt-3 text-sm text-foreground/52">
              Add <code className="rounded bg-dark/55 px-1.5 py-0.5 text-[0.82em]">NEXT_PUBLIC_PAYPAL_SUPPORT_URL</code>{' '}
              to enable the live payment button.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
