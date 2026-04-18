interface CategoryFilterProps {
  categories: Array<{
    count?: number;
    name: string;
  }>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="mb-12 flex flex-wrap justify-start gap-3 sm:justify-center sm:gap-4">
      {categories.map((category) => (
        <button
          key={category.name}
          type="button"
          onClick={() => onCategoryChange(category.name)}
          className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] transition-all sm:px-6 sm:text-sm sm:tracking-widest ${
            activeCategory === category.name
              ? 'bg-accent-gold text-dark'
              : 'bg-dark-secondary text-gray-400 hover:bg-dark-tertiary hover:text-white'
          }`}
        >
          <span>{category.name}</span>
          {typeof category.count === 'number' ? (
            <span className="ml-2 opacity-70">{category.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
