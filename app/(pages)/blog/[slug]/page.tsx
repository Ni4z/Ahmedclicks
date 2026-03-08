import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts } from '@/data/portfolio';
import { formatDate } from '@/lib/utils';
import { absoluteUrl } from '@/lib/site';

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function renderInline(content: string) {
  return content.split(/(\*\*.*?\*\*)/g).map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-white">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return segment;
  });
}

function renderContent(content: string) {
  return content
    .trim()
    .split('\n\n')
    .map((block, index) => {
      const lines = block.split('\n').filter(Boolean);

      if (lines.length === 1 && lines[0].startsWith('## ')) {
        return (
          <h2 key={`heading-${index}`} className="text-3xl font-serif font-bold mt-10 mb-4">
            {lines[0].replace(/^##\s+/, '')}
          </h2>
        );
      }

      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return (
          <ol key={`ordered-${index}`} className="space-y-3 list-decimal list-inside text-gray-300">
            {lines.map((line) => (
              <li key={line}>{renderInline(line.replace(/^\d+\.\s+/, ''))}</li>
            ))}
          </ol>
        );
      }

      if (lines.every((line) => /^-\s+/.test(line))) {
        return (
          <ul key={`unordered-${index}`} className="space-y-3 list-disc list-inside text-gray-300">
            {lines.map((line) => (
              <li key={line}>{renderInline(line.replace(/^-\s+/, ''))}</li>
            ))}
          </ul>
        );
      }

      return (
        <p key={`paragraph-${index}`} className="text-gray-300 leading-8">
          {renderInline(lines.join(' '))}
        </p>
      );
    });
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((entry) => entry.slug === slug);

  if (!post) {
    return {
      title: 'Article Not Found | NiazPhotography',
    };
  }

  return {
    title: `${post.title} | NiazPhotography`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}/`),
      images: [
        {
          url: absoluteUrl(post.image),
          alt: post.title,
        },
      ],
    },
  };
}

export default async function BlogPostPage({
  params,
}: BlogPostPageProps) {
  const { slug } = await params;
  const postIndex = blogPosts.findIndex((entry) => entry.slug === slug);

  if (postIndex === -1) {
    notFound();
  }

  const post = blogPosts[postIndex];
  const previousPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const nextPost =
    postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  return (
    <article className="min-h-screen bg-dark">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-sm text-gray-400 hover:text-accent-gold">
          ← Back to blog
        </Link>

        <div className="mt-8 mb-10">
          <p className="text-sm tracking-[0.3em] uppercase text-accent-gold mb-4">
            {post.category}
          </p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">{post.title}</h1>
          <div className="text-sm text-gray-500">
            {formatDate(post.date)} · {post.readTime} min read · {post.author}
          </div>
        </div>

        <div className="relative w-full h-[28rem] rounded-2xl overflow-hidden mb-10 bg-dark-secondary">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
          />
        </div>

        <div className="space-y-6">
          <p className="text-xl text-gray-300 leading-8">{post.excerpt}</p>
          {renderContent(post.content)}
        </div>

        <div className="mt-16 pt-8 border-t border-dark-tertiary grid gap-4 md:grid-cols-2">
          {previousPost ? (
            <Link
              href={`/blog/${previousPost.slug}`}
              className="p-5 rounded-lg border border-dark-tertiary hover:border-accent-gold transition-colors"
            >
              <span className="block text-xs tracking-[0.3em] text-gray-500 uppercase mb-2">
                Previous
              </span>
              <span className="font-serif text-xl">{previousPost.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="p-5 rounded-lg border border-dark-tertiary hover:border-accent-gold transition-colors text-right"
            >
              <span className="block text-xs tracking-[0.3em] text-gray-500 uppercase mb-2">
                Next
              </span>
              <span className="font-serif text-xl">{nextPost.title}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
