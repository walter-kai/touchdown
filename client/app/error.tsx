'use client';

import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Error() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neon-cyan mb-4">500</h1>
        <p className="text-text-light mb-6">Something went wrong</p>
        <button
          onClick={() => router.push('/')}
          className="btn-purple"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
