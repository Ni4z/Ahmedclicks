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
        Niaz Photography
      </span>
      <span
        className={`mt-1 flex items-center gap-3 pl-1 uppercase text-foreground/45 ${
          compact
            ? 'text-[0.38rem] tracking-[0.4em] sm:text-[0.42rem] sm:tracking-[0.46em]'
            : 'text-[0.48rem] tracking-[0.52em] md:text-[0.56rem]'
        }`}
      >
        <span
          className={compact ? 'h-px w-5 sm:w-7' : 'h-px w-7 md:w-10'}
          style={{
            background:
              'linear-gradient(90deg, rgba(var(--color-fg), 0.34) 0%, rgba(var(--color-fg), 0) 100%)',
          }}
        />
        Photography
      </span>
    </span>
  );
}
