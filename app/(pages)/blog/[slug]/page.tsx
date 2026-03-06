import { blogPosts } from '@/data/portfolio';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="relative w-full h-96 overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <Link href="/blog" className="text-accent-gold hover:underline mb-6 inline-block">
            ← Back to Blog
          </Link>

          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">{post.title}</h1>

          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <span>{formatDate(post.date)}</span>
            <span>•</span>
            <span>{post.readTime} min read</span>
            <span>•</span>
            <span className="text-accent-gold">{post.category}</span>
          </div>
        </div>

        {/* Article Content */}
        <article className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed space-y-6">
            {post.content.split('\n\n').map((paragraph, i) => {
              if (paragraph.startsWith('##')) {
                return (
                  <h2 key={i} className="text-3xl font-serif font-bold mt-8 mb-4">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('-')) {
                return (
                  <ul key={i} className="list-disc list-inside space-y-2">
                    {paragraph
                      .split('\n')
                      .filter((line) => line.startsWith('-'))
                      .map((line, j) => (
                        <li key={j}>{line.replace('- ', '')}</li>
                      ))}
                  </ul>
                );
              }
              return <p key={i}>{paragraph}</p>;
            })}
          </div>
        </article>

        {/* Author */}
        <div className="mt-20 pt-12 border-t border-dark-tertiary">
          <h3 className="text-xl font-serif font-bold mb-2">By {post.author}</h3>
          <p className="text-gray-400">
            Professional photographer sharing insights, tips, and stories from the road.
          </p>
        </div>
      </div>
    </div>
  );
}
