import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Marketing website rebuild in progress.",
};

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">WebDashy</h1>
      <p className="mt-4 text-xl">Turn Clicks Into Customers. Automatically.</p>
      <p className="mt-2">Marketing website rebuild in progress.</p>
    </main>
  );
}
