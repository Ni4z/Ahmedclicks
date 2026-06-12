import type { Metadata } from 'next';
import ContactPageClient from '@/components/contact/ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact | NiazPhotography',
  description:
    'Get in touch with NiazPhotography for print sales, licensing, portrait sessions, and collaborations.',
};

export default function ContactPage() {
  return <ContactPageClient />;
}
