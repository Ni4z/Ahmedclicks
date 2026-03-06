'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-serif font-bold mb-4">Oops!</h1>
        <h2 className="text-2xl font-serif font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-8 text-lg">
          We encountered an unexpected error. Please try again.
        </p>
        <button onClick={() => reset()} className="btn-primary inline-block">
          Try Again
        </button>
      </div>
    </div>
  );
}
