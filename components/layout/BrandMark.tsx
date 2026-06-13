interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="inline-flex flex-col leading-none text-foreground">
      <span
        className={`font-signature tracking-[0.01em] ${
          compact
            ? 'text-[1.55rem] sm:text-[1.95rem]'
            : 'text-[2.2rem] md:text-[2.65rem]'
        }`}
      >
        Niaz
      </span>
      <span
        className={`mt-1 uppercase text-foreground/45 ${
          compact
            ? 'text-[0.38rem] tracking-[0.4em] sm:text-[0.42rem] sm:tracking-[0.46em]'
            : 'text-[0.48rem] tracking-[0.52em] md:text-[0.56rem]'
        }`}
      >
        Photography
      </span>
    </span>
  );
}
