import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/outstanding-accounts")({
  beforeLoad: () => {
    throw redirect({
      to: "/outstanding/$type",
      params: { type: "company" },
    });
  },
});
