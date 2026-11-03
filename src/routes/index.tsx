import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/components/banking/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "United Bank Offshore | Client Portal Preview",
        description:
          "Explore the United Bank Offshore client-portal preview for multi-currency accounts. No live banking or real funds are provided.",
      },
      { property: "og:title", content: "United Bank Offshore | Client Portal Preview" },
      {
        property: "og:description",
        content:
          "An illustrative multi-currency client portal. No live banking or real funds are provided.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
