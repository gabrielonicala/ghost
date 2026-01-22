"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function AuthHeader() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="bg-background border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-sm text-foreground">
          Signed in as <span className="font-medium">{user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

