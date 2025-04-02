'use client';

import { Suspense } from 'react';
import AdminDiscounts from '../../content/discounts/page';

export default function DiscountsPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Discounts Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage promotional discounts and special offers for Learning Crypto members.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
        </div>
      }>
        <AdminDiscounts />
      </Suspense>
    </div>
  );
} 