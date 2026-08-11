import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminLiveEditBar } from "@/components/admin/inline-edit/AdminLiveEditBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { VisitBar } from "./VisitBar";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-28 lg:pb-0">
      <AdminLiveEditBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <VisitBar />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      <div className={cn("container-page py-12 md:py-16", centered && "text-center")}>
        {eyebrow && <div className="eyebrow mb-4">{eyebrow}</div>}
        <h1 className={cn("max-w-3xl text-4xl leading-[1.05] text-foreground md:text-6xl", centered && "mx-auto")}>
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg text-pretty",
              centered && "mx-auto",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
