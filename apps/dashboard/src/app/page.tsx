export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Pravado Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered PR, content, and SEO orchestration platform
        </p>
        <div className="flex gap-4 justify-center">
          <div className="px-6 py-3 bg-primary-500 text-white rounded-lg">
            Version 0.0.0-s0
          </div>
          <div className="px-6 py-3 bg-green-500 text-white rounded-lg">
            Sprint S0 Complete
          </div>
        </div>
      </div>
    </main>
  );
}
