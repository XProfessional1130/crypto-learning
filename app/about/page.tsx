import Link from 'next/link';

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">About Learning Crypto</h1>
        <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-500">
          Our mission is to make crypto education accessible, personalized, and actionable for everyone.
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
          <div className="mt-6 space-y-6 text-lg text-gray-600">
            <p>
              LearningCrypto was founded with a simple but powerful mission: to demystify the world of cryptocurrency and blockchain technology for everyone, regardless of their technical background.
            </p>
            <p>
              We believe that crypto represents a fundamental shift in how we think about money, value, and digital ownership. But for most people, the learning curve is steep and the resources available are either too technical or too simplistic.
            </p>
            <p>
              That's why we've built a platform that combines AI-driven education with professional-grade portfolio tools and market analytics. Our goal is to empower you with both knowledge and practical tools to navigate the crypto ecosystem with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900">Our Team</h2>
        <p className="mt-4 text-xl text-gray-500">
          Meet the experts behind LearningCrypto
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Team Member 1 */}
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-gray-200">
              <div className="flex h-full items-center justify-center bg-indigo-100 text-2xl font-bold text-indigo-600">
                AS
              </div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-medium text-gray-900">Alex Smith</h3>
              <p className="text-indigo-600">Founder & CEO</p>
              <p className="mt-3 text-gray-600">
                Former hedge fund manager with 10+ years of experience in traditional finance and 5+ years in crypto markets.
              </p>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-gray-200">
              <div className="flex h-full items-center justify-center bg-indigo-100 text-2xl font-bold text-indigo-600">
                JC
              </div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-medium text-gray-900">Jessica Chen</h3>
              <p className="text-indigo-600">Chief Technology Officer</p>
              <p className="mt-3 text-gray-600">
                Blockchain developer and architect with experience building DeFi protocols and Web3 applications.
              </p>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-gray-200">
              <div className="flex h-full items-center justify-center bg-indigo-100 text-2xl font-bold text-indigo-600">
                MR
              </div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-medium text-gray-900">Michael Rodriguez</h3>
              <p className="text-indigo-600">Head of Education</p>
              <p className="mt-3 text-gray-600">
                Former professor of Computer Science with a passion for making complex topics accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Education First</h3>
              <p className="mt-2 text-gray-600">
                We believe that informed investors make better decisions. Our platform prioritizes education and understanding above all else.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Accessibility</h3>
              <p className="mt-2 text-gray-600">
                Crypto should be for everyone. We design our tools and content to be accessible regardless of your technical background.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Transparency</h3>
              <p className="mt-2 text-gray-600">
                We're always clear about the risks and potential rewards of crypto investments. No hype, just honest analysis.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Innovation</h3>
              <p className="mt-2 text-gray-600">
                We continuously improve our platform with the latest AI technology and market analysis tools to give you the edge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="rounded-lg bg-indigo-700 px-6 py-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">Ready to start your crypto journey?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
          Join thousands of members who are already benefiting from our AI-driven crypto education platform.
        </p>
        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="inline-flex items-center rounded-md border border-transparent bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-sm hover:bg-indigo-50"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
} 