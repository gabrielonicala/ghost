import { ContentLibrary } from "@/components/content-library";
import { AddTestContent } from "@/components/add-test-content";

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
        <AddTestContent />
        <ContentLibrary />
      </div>
    </main>
  );
}
