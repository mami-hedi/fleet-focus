import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/vehicles")({
  component: () => <Outlet />,
});

// avoid unused import warning if any
export { Link };
