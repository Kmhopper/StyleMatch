import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <p className="font-display text-7xl text-primary md:text-8xl">404</p>
      <h1 className="font-display text-4xl md:text-5xl">Siden finnes ikke</h1>
      <p className="max-w-md text-muted-foreground">
        Adressen er ikke gyldig. Gå tilbake til forsiden for å fortsette.
      </p>
      <Button asChild size="lg">
        <Link href="/">Til forsiden</Link>
      </Button>
    </section>
  );
}
