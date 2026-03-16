import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <section className="space-y-5">
      <Card className="border-border/80 bg-card/90">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border-border/80 bg-card/95">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
