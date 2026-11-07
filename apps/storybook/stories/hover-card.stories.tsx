import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@workspace/ui/components/hover-card";

const meta = {
  title: "Components/HoverCard",
  component: HoverCard,
  render: (args) => (
    <HoverCard {...args}>
      <HoverCardTrigger href="https://example.com" className="text-sm underline underline-offset-4">
        @workspace_ui
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-1">
          <p className="font-medium">@workspace_ui</p>
          <p className="text-muted-foreground">
            Shared component library built with Base UI, cva, and Tailwind CSS.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
};

export const FastOpenSlowClose: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger
        href="https://example.com"
        delay={100}
        closeDelay={800}
        className="text-sm underline underline-offset-4"
      >
        Hover me (fast open, slow close)
      </HoverCardTrigger>
      <HoverCardContent>
        <p>Opens after 100ms, closes 800ms after the pointer leaves.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const SideTop: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger href="https://example.com" className="text-sm underline underline-offset-4">
        Hover me (top)
      </HoverCardTrigger>
      <HoverCardContent side="top">
        <p>Positioned above the trigger.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const SideRight: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger href="https://example.com" className="text-sm underline underline-offset-4">
        Hover me (right)
      </HoverCardTrigger>
      <HoverCardContent side="right">
        <p>Positioned to the right of the trigger.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const SideLeft: Story = {
  render: () => (
    <div className="ml-32">
      <HoverCard>
        <HoverCardTrigger
          href="https://example.com"
          className="text-sm underline underline-offset-4"
        >
          Hover me (left)
        </HoverCardTrigger>
        <HoverCardContent side="left">
          <p>Positioned to the left of the trigger.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};

export const AlignStart: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger href="https://example.com" className="text-sm underline underline-offset-4">
        Hover me (align start)
      </HoverCardTrigger>
      <HoverCardContent align="start">
        <p>Aligned to the start of the trigger.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const AlignEnd: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger href="https://example.com" className="text-sm underline underline-offset-4">
        Hover me (align end)
      </HoverCardTrigger>
      <HoverCardContent align="end">
        <p>Aligned to the end of the trigger.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Controlled: Story = {
  render: () => {
    function ControlledHoverCard() {
      const [open, setOpen] = React.useState(false);

      return (
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            className="text-sm underline underline-offset-4"
            onClick={() => setOpen((value) => !value)}
          >
            Toggle preview ({open ? "open" : "closed"})
          </button>
          <HoverCard open={open} onOpenChange={setOpen}>
            <HoverCardTrigger
              href="https://example.com"
              className="text-sm underline underline-offset-4"
            >
              Controlled trigger
            </HoverCardTrigger>
            <HoverCardContent>
              <p>This preview's open state is controlled externally.</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      );
    }

    return <ControlledHoverCard />;
  },
};
