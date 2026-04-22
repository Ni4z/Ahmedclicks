import type { Metadata } from 'next';
import { Suspense } from 'react';
import PrintsPageClient from '@/components/prints/PrintsPageClient';

export const metadata: Metadata = {
  title: 'Prints & Licensing | NiazPhotography',
  description:
    'Fine art print enquiries and image licensing information for selected photographs from NiazPhotography.',
};

export default function PrintsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark" />}>
      <PrintsPageClient />
    </Suspense>
  );
}
