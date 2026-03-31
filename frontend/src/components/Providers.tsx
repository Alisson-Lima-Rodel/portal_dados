"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { FullscreenProvider } from "@/contexts/FullscreenContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryProvider>
        <AuthProvider>
          <TooltipProvider>
            <FullscreenProvider>
              {children}
            </FullscreenProvider>
          </TooltipProvider>
        </AuthProvider>
      </QueryProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
