'use client';

import { useTheme } from '@/lib/theme-context';
import Image from 'next/image';
import Link from 'next/link';

interface ThemeLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function ThemeLogo({ 
  className = "", 
  width = 130, 
  height = 32 
}: ThemeLogoProps) {
  const { theme } = useTheme();
  
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image 
        src={theme === 'dark' 
          ? '/logos/logo-white.png' 
          : '/logos/logo-green.png'
        }
        alt="Learning Crypto"
        width={width}
        height={height}
        priority // Makes logo load with priority
        className="w-auto h-auto transition-all duration-300 hover:opacity-90"
      />
    </Link>
  );
} 