interface CategoryFilterProps {
  categories: string[];
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
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-6 py-2 rounded-full text-sm tracking-widest transition-all font-semibold ${
            activeCategory === category
              ? 'bg-accent-gold text-dark'
              : 'bg-dark-secondary text-gray-400 hover:bg-dark-tertiary hover:text-white'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
