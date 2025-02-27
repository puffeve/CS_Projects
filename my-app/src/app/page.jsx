import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#c1d9a4] via-[#95c9a6] to-[#64b6b3]">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h1 className="text-5xl font-light text-center text-white mb-12">
            ClassMood Insight
          </h1>
          <div className="mt-16 space-y-4">
            <Link 
              href="/login"
              className="w-full flex justify-center py-3 px-4 border border-teal-600 border-opacity-30 rounded-md shadow-md text-xl font-light text-white bg-teal-700 bg-opacity-40 hover:bg-opacity-50 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}