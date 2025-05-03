import React, { Suspense } from 'react';
import DevelopSidebar from '@/components/DevelopSidebar'; // Use path alias

export default function DevelopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">
      {/* Wrap sidebar in Suspense in case it needs data later */}
      <Suspense fallback={<div>Loading Sidebar...</div>}>
        <DevelopSidebar />
      </Suspense>
      <main className="flex flex-col flex-1 overflow-y-auto p-6">
        {/* Wrap page content in Suspense as well */}
        <Suspense fallback={<div>Loading Content...</div>}>
            {children}
        </Suspense>
      </main>
    </div>
  );
} 