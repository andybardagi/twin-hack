import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu";

function TriggerArea({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-40 w-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {children ?? "Right click here"}
    </div>
  );
}

const meta = {
  title: "Components/ContextMenu",
  component: ContextMenu,
} satisfies Meta<typeof ContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <TriggerArea />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Actions</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem>
            Back
            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Forward
            <ContextMenuShortcut>⌘]</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Reload</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithSubmenu: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <TriggerArea>Right click for submenu</TriggerArea>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Back</ContextMenuItem>
        <ContextMenuItem>Forward</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Save Page As...</ContextMenuItem>
            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
            <ContextMenuItem>Developer Tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithCheckboxAndRadioItems: Story = {
  render: () => {
    function Demo() {
      const [showBookmarks, setShowBookmarks] = React.useState(true);
      const [showFullUrls, setShowFullUrls] = React.useState(false);
      const [person, setPerson] = React.useState("pedro");

      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <TriggerArea>Right click for options</TriggerArea>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={showBookmarks} onCheckedChange={setShowBookmarks}>
              Show Bookmarks Bar
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem checked={showFullUrls} onCheckedChange={setShowFullUrls}>
              Show Full URLs
            </ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
              <ContextMenuLabel>People</ContextMenuLabel>
              <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
              <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    return <Demo />;
  },
};

export const WithDisabledItem: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <TriggerArea>Right click for options</TriggerArea>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem disabled>Paste (disabled)</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const InsetItems: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <TriggerArea>Right click for options</TriggerArea>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Options</ContextMenuLabel>
          <ContextMenuItem inset>Back</ContextMenuItem>
          <ContextMenuItem inset>Forward</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
