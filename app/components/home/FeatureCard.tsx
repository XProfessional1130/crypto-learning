'use client';

import { ReactNode } from 'react';
import Card from '../ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <div className="mb-4 rounded-full bg-indigo-100 p-3 text-indigo-700 inline-block">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </Card>
  );
} 