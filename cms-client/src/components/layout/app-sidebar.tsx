import { NavLink, useMatch } from "react-router";
import {
  Files,
  KeyRound,
  Users,
  Database,
} from "lucide-react";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRecentCollections } from "@/lib/queries";

export function AppSidebar() {
  const { state } = useSidebar();
  const library = useMatch({ path: "/library", end: true });
  const collectionsList = useMatch({ path: "/collections", end: true });
  const collectionById = useMatch("/collections/:id");
  const collectionItems = useMatch("/collections/:id/items");
  const collectionItemEdit = useMatch("/collections/:id/items/:itemId");
  const collectionNewItem = useMatch("/collections/:id/items/new");
  const apiKeys = useMatch({ path: "/api-keys", end: true });
  const users = useMatch({ path: "/users", end: true });

  const collectionsActive = Boolean(
    collectionsList ||
      collectionById ||
      collectionItems ||
      collectionItemEdit ||
      collectionNewItem,
  );

  const recentQuery = useRecentCollections(5);
  const recent = recentQuery.data?.data ?? [];
  const activeCollectionId = collectionById?.params.id;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 shrink-0 flex-row items-center gap-2 border-b border-border px-2 py-0">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="CMS Admin">
              <NavLink to="/collections">
                <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                  C
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">CMS Admin</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={collectionsActive}
                  tooltip="Collections"
                >
                  <NavLink to="/collections">
                    <Database />
                    <span>Collections</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {state === "expanded" && recent.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recent.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeCollectionId === String(item.id)}
                      tooltip={item.title}
                    >
                      <NavLink to={`/collections/${item.id}`}>
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Assets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={Boolean(library)}
                  tooltip="File library"
                >
                  <NavLink to="/library">
                    <Files />
                    <span>Library</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={Boolean(apiKeys)}
                  tooltip="API keys"
                >
                  <NavLink to="/api-keys">
                    <KeyRound />
                    <span>API keys</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={Boolean(users)}
                  tooltip="Users"
                >
                  <NavLink to="/users">
                    <Users />
                    <span>Users</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarUserMenu />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
