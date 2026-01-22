import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

/**
 * Test endpoint to debug Inngest event sending
 */
export async function GET(request: NextRequest) {
  try {
    const testEvent = {
      name: "content/process",
      data: {
        contentItemId: "test-content-id",
        organizationId: "test-org-id",
      },
    };

    console.log("Attempting to send Inngest event:", testEvent);
    console.log("Inngest client config:", {
      id: inngest.id,
      hasEventKey: !!process.env.INNGEST_EVENT_KEY,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
    });

    try {
      const result = await inngest.send(testEvent);
      console.log("Inngest send result:", result);

      return NextResponse.json({
        success: true,
        message: "Event sent successfully",
        event: testEvent,
        result,
        config: {
          hasEventKey: !!process.env.INNGEST_EVENT_KEY,
          hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
        },
      });
    } catch (sendError: any) {
      console.error("Inngest send error:", sendError);
      return NextResponse.json(
        {
          success: false,
          error: sendError.message,
          stack: sendError.stack,
          event: testEvent,
          config: {
            hasEventKey: !!process.env.INNGEST_EVENT_KEY,
            hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

