import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const users = await prisma.user.findMany();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center -mt-16">
      <div className="w-full max-w-4xl px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Superblog</h1>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="default">
                <Link href="/posts">Posts</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/documents">Documents</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/documents/new">New Document</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {users.map((user) => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
