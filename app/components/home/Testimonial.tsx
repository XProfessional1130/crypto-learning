'use client';

import Card from '../ui/Card';

interface TestimonialProps {
  name: string;
  role: string;
  content: string;
}

export default function Testimonial({ name, role, content }: TestimonialProps) {
  return (
    <Card variant="elevated" padding="lg" className="shadow-md">
      <div className="flex items-center">
        <div className="ml-4">
          <p className="text-lg font-semibold text-gray-900">{name}</p>
          <p className="text-gray-500">{role}</p>
        </div>
      </div>
      <p className="mt-4 text-gray-600">"{content}"</p>
    </Card>
  );
} 