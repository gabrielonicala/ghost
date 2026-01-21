import { ContentLibrary } from "@/components/content-library";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Creator Intelligence & UGC Performance Platform
          </h1>
          <p className="text-gray-600">
            Not all UGC converts. We tell you which content actually will — before you
            spend money.
          </p>
        </div>
        <ContentLibrary />
      </div>
    </main>
  );
}
