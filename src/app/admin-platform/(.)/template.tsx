'use client';

// This template ensures the admin platform is completely isolated
export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 