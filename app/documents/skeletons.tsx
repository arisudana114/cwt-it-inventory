import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DocumentCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-64 bg-muted rounded"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
          <div className="h-6 w-20 bg-muted rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-24 w-full bg-muted rounded-md"></div>
      </CardContent>
    </Card>
  );
}

export function DocumentListSkeleton() {
  return (
    <div className="space-y-8">
      <DocumentCardSkeleton />
      <DocumentCardSkeleton />
      <DocumentCardSkeleton />
    </div>
  );
}
