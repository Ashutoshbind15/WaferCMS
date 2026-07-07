import { NavLink, useMatch } from "react-router";
import {
  ImageIcon,
  Plus,
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
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const library = useMatch({ path: "/library", end: true });
  const collectionsList = useMatch({ path: "/collections", end: true });
  const collectionNew = useMatch("/collections/new");
  const collectionById = useMatch("/collections/:id");
  const collectionItems = useMatch("/collections/:id/items");
  const collectionItemEdit = useMatch("/collections/:id/items/:itemId");
  const collectionNewItem = useMatch("/collections/:id/items/new");
  const apiKeys = useMatch({ path: "/api-keys", end: true });
  const users = useMatch({ path: "/users", end: true });

  const collectionsActive = Boolean(
    collectionsList ||
      collectionNew ||
      collectionById ||
      collectionItems ||
      collectionItemEdit ||
      collectionNewItem,
  );

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
                    <span>All collections</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={Boolean(collectionNew)}
                  tooltip="New collection"
                >
                  <NavLink to="/collections/new">
                    <Plus />
                    <span>New collection</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Images</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={Boolean(library)}
                  tooltip="Image library"
                >
                  <NavLink to="/library">
                    <ImageIcon />
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
