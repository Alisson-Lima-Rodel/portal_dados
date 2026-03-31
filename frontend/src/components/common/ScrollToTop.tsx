"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<Element | null>(null);

  useEffect(() => {
    // O container de scroll é o <main> com overflow-auto
    const main = document.querySelector("main");
    if (!main) return;
    setScrollTarget(main);

    function handleScroll() {
      setVisible((main?.scrollTop ?? 0) > 300);
    }

    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollTarget?.scrollTo({ top: 0, behavior: "smooth" });
  }, [scrollTarget]);

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
