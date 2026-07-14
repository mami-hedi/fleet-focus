import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Car, ClipboardCheck, Wrench, FileText, Plus,
  CalendarDays, BarChart3, Fuel, AlertTriangle, Settings,
  Users, BookOpen, ShieldAlert
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar";

// ─── Navigation principale ───
const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Véhicules", url: "/vehicles", icon: Car },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
];

// ─── Actions rapides ───
const quickActions = [
  { title: "Nouvel état des lieux", url: "/inspections/new", icon: Plus },
  { title: "Nouveau document", url: "/documents?add=1", icon: FileText },
];

// ─── Planification & suivi ───
const planningNav = [
  { title: "Calendrier", url: "/calendar", icon: CalendarDays },
  { title: "Réservations", url: "/reservations", icon: Car },
  { title: "Conducteurs", url: "/drivers", icon: Users },
];

// ─── Analytiques ───
const analyticsNav = [
  { title: "Statistiques", url: "/stats", icon: BarChart3 },
  { title: "Carburant", url: "/fuel", icon: Fuel },
];

// ─── Gestion des risques ───
const riskNav = [
  { title: "Alertes", url: "/alerts", icon: AlertTriangle, badge: true },
  { title: "Incidents", url: "/incidents", icon: ShieldAlert },
];

// ─── Administration ───
const adminNav = [
  { title: "Journal d'activité", url: "/activity", icon: BookOpen },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/") || pathname === url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">MH FleetOps</span>
            <span className="text-[11px] text-muted-foreground">Powered by MH Digital Solution</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* ─── Navigation principale ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ─── Actions rapides ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>Actions rapides</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ─── Planification ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>Planification</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {planningNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ─── Analytiques ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>Analytiques</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ─── Gestion des risques ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestion des risques</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {riskNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="relative">
                      <item.icon />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                          3
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ─── Administration ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ─── Footer ─── */}
      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span>Parc opérationnel</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}