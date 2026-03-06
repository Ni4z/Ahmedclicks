'use client';

import { motion } from 'framer-motion';
import { blogPosts } from '@/data/portfolio';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts.find((p) => p.slug === params.slug);

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
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
        </motion.div>

        {/* Article Content */}
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none"
        >
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
        </motion.article>

        {/* Author */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-dark-tertiary"
        >
          <h3 className="text-xl font-serif font-bold mb-2">By {post.author}</h3>
          <p className="text-gray-400">
            Professional photographer sharing insights, tips, and stories from the road.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
