'use client';

export default function AdminWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full -mt-[60px]">
      {children}
    </div>
  );
} 