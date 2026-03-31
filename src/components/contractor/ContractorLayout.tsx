import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, BarChart3, ShoppingBag, Hammer, Bookmark, UserCircle, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Overview", url: "/contractor", icon: LayoutDashboard },
  { title: "Analytics", url: "/contractor/analytics", icon: BarChart3 },
  { title: "Marketplace", url: "/contractor/marketplace", icon: ShoppingBag },
  { title: "Current Jobs", url: "/contractor/current", icon: Hammer },
  { title: "Saved Jobs", url: "/contractor/saved", icon: Bookmark },
  { title: "Profile", url: "/contractor/profile", icon: UserCircle },
  { title: "Notifications", url: "/contractor/notifications", icon: Bell },
];

function ContractorSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-display font-bold text-sidebar-primary">VoidZero</h2>
            <p className="text-xs text-sidebar-foreground/60">{user?.name}</p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/contractor"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="p-2 mt-auto">
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => { logout(); navigate("/"); }}>
          <LogOut className="mr-2 h-4 w-4" /> {!collapsed && "Logout"}
        </Button>
      </div>
    </Sidebar>
  );
}

export default function ContractorLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ContractorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-sm font-medium text-muted-foreground">Contractor Dashboard</h1>
          </header>
          <main className="flex-1 p-6 bg-muted/30 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
