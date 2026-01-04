/**
 * Home Page
 * Simple redirect/info page
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Shine ✨
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Video Testimonial Platform
        </p>

        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Demo Sessions
          </h2>
          <div className="space-y-2">
            <Link
              href="/interview/session_abc123"
              className="block p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <span className="font-medium text-purple-600 dark:text-purple-400">
                session_abc123
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Acme Corp - 12 questions (gradient style)
              </p>
            </Link>

            <Link
              href="/interview/session_xyz789"
              className="block p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <span className="font-medium text-blue-600 dark:text-blue-400">
                session_xyz789
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                TechStartup Inc - 5 questions (solid style)
              </p>
            </Link>

            <Link
              href="/interview/session_demo"
              className="block p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
            >
              <span className="font-medium text-pink-600 dark:text-pink-400">
                session_demo
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Demo Company - 6 questions (default)
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
