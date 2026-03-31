"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullscreenContextType {
  isFullscreen: boolean;
  openFullscreen: (content: ReactNode, title?: string) => void;
  closeFullscreen: () => void;
}

const FullscreenContext = createContext<FullscreenContextType>({
  isFullscreen: false,
  openFullscreen: () => {},
  closeFullscreen: () => {},
});

export const useFullscreen = () => useContext(FullscreenContext);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [showClose, setShowClose] = useState(false);

  const openFullscreen = useCallback((node: ReactNode) => {
    setContent(node);
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setContent(null);
  }, []);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, openFullscreen, closeFullscreen }}>
      {children}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-background"
          onMouseMove={(e) => {
            const threshold = 60;
            const centerX = window.innerWidth / 2;
            setShowClose(
              e.clientY < threshold &&
              Math.abs(e.clientX - centerX) < 200
            );
          }}
          onMouseLeave={() => setShowClose(false)}
        >
          {/* Botão X no centro superior - aparece ao hover */}
          <div
            className={cn(
              "absolute top-3 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-200",
              showClose ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <button
              onClick={closeFullscreen}
              className="flex items-center gap-2 rounded-full bg-card border shadow-lg px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
              Fechar tela cheia
            </button>
          </div>

          <div className="h-full w-full overflow-auto">
            {content}
          </div>
        </div>
      )}
    </FullscreenContext.Provider>
  );
}
