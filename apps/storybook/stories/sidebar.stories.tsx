import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "@workspace/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <IconBase>
      <path d="M3 9.5 12 3l9 6.5V21H3z" />
    </IconBase>
  );
}

function InboxIcon() {
  return (
    <IconBase>
      <path d="M4 4h16v10.5l-3 5.5H7l-3-5.5Z" />
      <path d="M4 12h5l1.5 3h3L15 12h5" />
    </IconBase>
  );
}

function CalendarIcon() {
  return (
    <IconBase>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </IconBase>
  );
}

function SearchIcon() {
  return (
    <IconBase>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </IconBase>
  );
}

function SettingsIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </IconBase>
  );
}

function ChevronRightIcon() {
  return (
    <IconBase>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

function PlusIcon() {
  return (
    <IconBase>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

const platformItems = [
  { title: "Home", icon: HomeIcon, badge: undefined },
  { title: "Inbox", icon: InboxIcon, badge: "12" },
  { title: "Calendar", icon: CalendarIcon, badge: undefined },
];

function SidebarDemo({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible}>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
              W
            </div>
            <span className="text-sm font-medium">Workspace</span>
          </div>
          <SidebarInput placeholder="Search..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {platformItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Design system" isActive>
                    <SearchIcon />
                    <span>Design system</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover>
                    <ChevronRightIcon />
                  </SidebarMenuAction>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#">Components</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#" isActive>
                        Tokens
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <SettingsIcon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MenuButtonVariantsDemo() {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupAction>
              <PlusIcon />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline">
                    <HomeIcon />
                    <span>Outline (default size)</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline" size="sm">
                    <InboxIcon />
                    <span>Outline (small)</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline" size="lg">
                    <CalendarIcon />
                    <span>Outline (large)</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 items-center p-4 text-sm text-muted-foreground">
          Menu button variant/size and group action showcase.
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const meta = {
  title: "Components/Sidebar",
  component: SidebarDemo,
  argTypes: {
    side: {
      control: "select",
      options: ["left", "right"],
    },
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
    },
    defaultOpen: { control: "boolean" },
  },
  args: {
    side: "left",
    variant: "sidebar",
    collapsible: "offcanvas",
    defaultOpen: true,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SidebarDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: { defaultOpen: false },
};

export const CollapsibleIcon: Story = {
  args: { collapsible: "icon", defaultOpen: true },
};

export const CollapsibleIconCollapsed: Story = {
  args: { collapsible: "icon", defaultOpen: false },
};

export const Floating: Story = {
  args: { variant: "floating" },
};

export const Inset: Story = {
  args: { variant: "inset" },
};

export const RightSide: Story = {
  args: { side: "right" },
};

export const NonCollapsible: Story = {
  args: { collapsible: "none" },
};

export const ButtonVariantsAndGroupAction: Story = {
  render: () => <MenuButtonVariantsDemo />,
  parameters: {
    layout: "fullscreen",
  },
};
