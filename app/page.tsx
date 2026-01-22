"use client";

import { ContentLibrary } from "@/components/content-library";
import { AddTestContent } from "@/components/add-test-content";
import { AuthHeader } from "@/components/auth-header";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <AuthHeader />
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
    </>
  );
}
