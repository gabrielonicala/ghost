import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "creator-intelligence-platform",
  name: "Creator Intelligence Platform",
  // Signing key is automatically used by Inngest Next.js serve() function
  // via INNGEST_SIGNING_KEY environment variable
  // Event key (if needed) can be set via INNGEST_EVENT_KEY
  eventKey: process.env.INNGEST_EVENT_KEY,
});

