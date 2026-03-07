import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-serif font-bold mb-4">404</h1>
        <h2 className="text-4xl font-serif font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8 text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Return Home
        </Link>
      </div>
    </div>
  );
}
