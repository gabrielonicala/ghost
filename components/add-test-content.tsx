"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AddTestContent() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const addTestContent = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/content/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "instagram",
          username: `test_creator_${Math.floor(Math.random() * 1000)}`,
          caption: "Just tried this amazing product! Highly recommend! #sponsored #ad",
          contentType: "image",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Test content added! Refresh the page to see it.");
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Test Content</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Add sample content to test the platform. This creates a test creator and content item
          with mock engagement metrics.
        </p>
        <button
          onClick={addTestContent}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Adding..." : "Add Test Content"}
        </button>
        {message && (
          <p className={`mt-4 text-sm ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

