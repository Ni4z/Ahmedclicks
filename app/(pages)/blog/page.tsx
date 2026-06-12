import type { Metadata } from 'next';
import BlogPageClient from '@/components/blog/BlogPageClient';

export const metadata: Metadata = {
  title: 'Blog | NiazPhotography',
  description:
    'Process notes, field observations, and practical photography articles from NiazPhotography.',
};

export default function BlogPage() {
  return <BlogPageClient />;
}
