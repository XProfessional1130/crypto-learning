'use client';

import { Navigation } from "./components";
import { usePathname } from "next/navigation";

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin-platform');

  return (
    <>
      <Navigation />
      <div className={isAdminPage ? '' : 'pt-16'}>
        {children}
      </div>
    </>
  );
} 