import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Documents</h1>
          <ThemeToggle />
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/documents">All IN Documents</Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/documents/new">Create New Document</Link>
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-lg p-6 shadow-sm border">{children}</div>
    </div>
  );
}
