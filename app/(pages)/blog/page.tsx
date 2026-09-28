import type { Metadata } from 'next';
import BlogPageClient from '@/components/blog/BlogPageClient';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Blog | NiazPhotography',
  description:
    'Process notes, field observations, and practical photography articles from NiazPhotography.',
  alternates: { canonical: absoluteUrl('/blog/') },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
