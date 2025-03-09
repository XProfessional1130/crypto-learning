'use client';

import Section from '../ui/Section';
import Testimonial from './Testimonial';

// Define testimonials as constants to avoid recreation on each render
const testimonials = [
  {
    name: 'Alex Thompson',
    role: 'Crypto Enthusiast',
    content: 'LearningCrypto transformed my understanding of blockchain technology. The AI chat feature is like having a personal tutor available 24/7.'
  },
  {
    name: 'Sarah Chen',
    role: 'Investment Analyst',
    content: 'The portfolio tracking tools are exceptional. I\'ve been able to optimize my investments and increase my returns by following the insights provided.'
  },
  {
    name: 'Michael Rivera',
    role: 'Day Trader',
    content: 'The market analytics and on-chain data have been game-changing for my trading strategy. I especially love the whale wallet tracking feature.'
  }
];

export default function TestimonialsSection() {
  return (
    <Section background="light" className="bg-indigo-50">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          What Our Members Say
        </h2>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Testimonial
            key={index}
            name={testimonial.name}
            role={testimonial.role}
            content={testimonial.content}
          />
        ))}
      </div>
    </Section>
  );
} 