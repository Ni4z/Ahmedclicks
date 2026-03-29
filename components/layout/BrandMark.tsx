interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="inline-flex flex-col leading-none">
      <span
        className={`font-signature text-white drop-shadow-[0_2px_16px_rgba(255,255,255,0.08)] ${
          compact ? 'text-[2.15rem]' : 'text-[2.4rem] md:text-[2.9rem]'
        }`}
      >
        Niaz Photography
      </span>
      <span
        className={`mt-1 flex items-center gap-3 pl-1 uppercase text-white/55 ${
          compact
            ? 'text-[0.42rem] tracking-[0.42em]'
            : 'text-[0.48rem] tracking-[0.48em] md:text-[0.56rem]'
        }`}
      >
        <span className="h-px w-7 bg-gradient-to-r from-accent-gold/80 to-transparent md:w-10" />
        Visual Journal
      </span>
    </span>
  );
}
