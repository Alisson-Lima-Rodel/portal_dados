"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getAreas } from "@/services/areaApi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  LayoutGrid,
  Users,
  Database,
  BarChart3,
  FileText,
  Menu,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart,
  DollarSign,
  UserCircle,
  Cog,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  "chart-bar": BarChart,
  "dollar-sign": DollarSign,
  users: UserCircle,
  cog: Cog,
};

function SidebarContent({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/catalog", label: "Catálogo", icon: LayoutGrid },
  ];

  const adminItems = [
    {
      href: "/admin/dashboards",
      label: "Dashboards",
      icon: BarChart3,
      permission: "edit_dashboard" as const,
    },
    {
      href: "/admin/users",
      label: "Usuários",
      icon: Users,
      permission: "manage_users" as const,
    },
    {
      href: "/admin/connections",
      label: "Conexões",
      icon: Database,
      permission: "manage_connections" as const,
    },
    {
      href: "/admin/audit",
      label: "Auditoria",
      icon: FileText,
      permission: "manage_users" as const,
    },
  ];

  const visibleAdminItems = adminItems.filter((item) =>
    hasPermission(item.permission)
  );

  function NavLink({ href, label, icon: Icon, isActive }: {
    href: string; label: string; icon: React.ElementType; isActive: boolean;
  }) {
    const link = (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && label}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger render={link} />
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  }

  return (
    <ScrollArea className="h-full py-4">
      <div className="space-y-6 px-3">
        {/* Navegação principal */}
        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navegação
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </div>

        {/* Áreas / Departamentos */}
        {areas.length > 0 && (
          <div>
            {!collapsed && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Áreas
              </p>
            )}
            <nav className="space-y-1">
              {areas.map((area) => {
                const Icon = iconMap[area.icone] || BarChart;
                const href = `/catalog?area_id=${area.id}`;
                const isActive =
                  typeof window !== "undefined" &&
                  pathname + window.location.search === href;
                return (
                  <NavLink
                    key={area.id}
                    href={href}
                    label={area.nome}
                    icon={Icon}
                    isActive={isActive}
                  />
                );
              })}
            </nav>
          </div>
        )}

        {/* Admin */}
        {visibleAdminItems.length > 0 && (
          <div>
            {!collapsed && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administração
              </p>
            )}
            <nav className="space-y-1">
              {visibleAdminItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname.startsWith(item.href)}
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col border-r bg-sidebar transition-all duration-200 relative",
        collapsed ? "lg:w-16" : "lg:w-60"
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <div className="absolute -right-3 top-3 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full border bg-background shadow-sm"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3 w-3" />
          ) : (
            <PanelLeftClose className="h-3 w-3" />
          )}
        </Button>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
