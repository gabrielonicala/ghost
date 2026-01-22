"use client";

import { ContentLibrary } from "@/components/content-library";
import { AddTestContent } from "@/components/add-test-content";
import { TestMediaProcessing } from "@/components/test-media-processing";
import { AuthHeader } from "@/components/auth-header";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <AuthHeader />
      <main className="min-h-screen p-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Creator Intelligence & UGC Performance Platform
            </h1>
            <p className="text-muted-foreground">
              Not all UGC converts. We tell you which content actually will — before you
              spend money.
            </p>
          </div>
          <AddTestContent />
          <TestMediaProcessing />
          <ContentLibrary />
        </div>
      </main>
    </>
  );
}
