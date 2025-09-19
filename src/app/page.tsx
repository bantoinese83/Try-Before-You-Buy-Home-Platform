import Link from 'next/link'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Try-Before-You-Buy Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Experience properties before you buy them
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/api-gateway"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              API Gateway Simulator
            </Link>
          </div>
        </div>
        <Dashboard />
      </div>
    </div>
  )
}