'use client';

import Section from '../ui/Section';
import Button from '../ui/Button';

export default function CTASection() {
  return (
    <Section background="primary" className="bg-indigo-700">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Level Up Your Crypto Knowledge?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
          Join thousands of members who are already benefiting from our AI-driven crypto education platform.
        </p>
        <div className="mt-8">
          <Button
            href="/auth/signin"
            variant="secondary"
            size="lg"
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </Section>
  );
} 