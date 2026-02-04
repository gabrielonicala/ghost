"use client";

import { ContentLibrary } from "@/components/content-library";
import { AddContent } from "@/components/add-content";
import { AuthHeader } from "@/components/auth-header";
import { LandingPage } from "@/components/landing-page";
import { useAuth } from "@/contexts/auth-context";
import { Ghost, LayoutGrid } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg shadow-primary/30 animate-pulse-glow">
            <Ghost className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="spinner" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Analyze creator content and track conversion potential with ACCS scoring.
          </p>
        </div>

        <AddContent />
        <ContentLibrary />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
                <Ghost className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">Ghost</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ghost. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
