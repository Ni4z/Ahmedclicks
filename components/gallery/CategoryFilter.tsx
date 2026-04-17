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
    <div className="flex flex-wrap gap-4 mb-12 justify-center">
      {categories.map((category) => (
        <button
          key={category.name}
          type="button"
          onClick={() => onCategoryChange(category.name)}
          className={`px-6 py-2 rounded-full text-sm tracking-widest transition-all font-semibold ${
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
