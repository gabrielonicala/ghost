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
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white border-b p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Signed in as <span className="font-medium">{user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

