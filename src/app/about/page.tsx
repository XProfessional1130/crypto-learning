import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            About Learning Crypto
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600 dark:text-gray-300">
            Our mission is to make crypto education accessible, personalized, and actionable for everyone.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-20">
          <div className="mx-auto max-w-3xl rounded-xl border border-gray-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
            <div className="mt-6 space-y-6 text-lg text-gray-600 dark:text-gray-300">
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
        <div className="mb-20">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900 dark:text-white">Our Team</h2>
          <p className="mb-12 text-center text-xl text-gray-600 dark:text-gray-300">
            Meet the experts behind LearningCrypto
          </p>

          <div className="mx-auto max-w-7xl grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Team Member 1 */}
            <div className="group rounded-xl border border-gray-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700 dark:hover:shadow-none">
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                  AS
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Alex Smith</h3>
                <p className="text-gray-700 dark:text-gray-300">Founder & CEO</p>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  Former hedge fund manager with 10+ years of experience in traditional finance and 5+ years in crypto markets.
                </p>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="group rounded-xl border border-gray-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700 dark:hover:shadow-none">
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                  JC
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Jessica Chen</h3>
                <p className="text-gray-700 dark:text-gray-300">Chief Technology Officer</p>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  Blockchain developer and architect with experience building DeFi protocols and Web3 applications.
                </p>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="group rounded-xl border border-gray-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700 dark:hover:shadow-none">
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                  MR
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Michael Rodriguez</h3>
                <p className="text-gray-700 dark:text-gray-300">Head of Education</p>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  Former professor of Computer Science with a passion for making complex topics accessible to everyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">Our Values</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Value 1 */}
              <div className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                    <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.727 6.727 0 0 0 .551-1.608 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Education First</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  We believe that informed investors make better decisions. Our platform prioritizes education and understanding above all else.
                </p>
              </div>

              {/* Value 2 */}
              <div className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                    <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Accessibility</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  Crypto should be for everyone. We design our tools and content to be accessible regardless of your technical background.
                </p>
              </div>

              {/* Value 3 */}
              <div className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transparency</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  We're always clear about the risks and potential rewards of crypto investments. No hype, just honest analysis.
                </p>
              </div>

              {/* Value 4 */}
              <div className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Innovation</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  We continuously improve our platform with the latest AI technology and market analysis tools to give you the edge.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-gray-200 bg-gray-800 px-6 py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-3xl font-bold tracking-tight text-white">Ready to start your crypto journey?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-200">
            Join thousands of members who are already benefiting from our AI-driven crypto education platform.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/signin"
              className="inline-flex items-center rounded-lg border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-800 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-white/95 dark:hover:bg-white"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 