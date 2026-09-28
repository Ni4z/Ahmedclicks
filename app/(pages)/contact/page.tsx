import type { Metadata } from 'next';
import ContactPageClient from '@/components/contact/ContactPageClient';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact | NiazPhotography',
  description:
    'Get in touch with NiazPhotography for print sales, licensing, portrait sessions, and collaborations.',
  alternates: { canonical: absoluteUrl('/contact/') },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
