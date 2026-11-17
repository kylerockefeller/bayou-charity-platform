'use client';

// Admin role is enforced by middleware for /members/admin.
import Link from 'next/link';
import { PinCropAdmin } from '@/components/members/PinCropAdmin';

export default function PinCropsPage() {
  return (
    <div className="space-y-4">
      <Link href="/members/admin" className="font-serif text-sm text-amber">Back to admin</Link>
      <PinCropAdmin />
    </div>
  );
}
