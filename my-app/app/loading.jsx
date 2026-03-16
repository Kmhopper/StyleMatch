import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center gap-5">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-4 w-72" />
    </section>
  );
}
