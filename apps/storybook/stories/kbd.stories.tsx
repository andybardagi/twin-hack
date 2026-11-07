import type { Meta, StoryObj } from "@storybook/react-vite";

import { Kbd, KbdGroup } from "@workspace/ui/components/kbd";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  args: {
    children: "K",
  },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Letter: Story = {
  args: { children: "K" },
};

export const Symbol: Story = {
  args: { children: "⌘" },
};

export const Word: Story = {
  args: { children: "Ctrl" },
};

export const Group: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const GroupWithSeparator: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <span className="text-muted-foreground text-xs">+</span>
      <Kbd>Shift</Kbd>
      <span className="text-muted-foreground text-xs">+</span>
      <Kbd>P</Kbd>
    </KbdGroup>
  ),
};

export const InsideTooltipLikeContainer: Story = {
  render: () => (
    <div data-slot="tooltip-content" className="rounded-md bg-foreground px-2 py-1 text-background">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>S</Kbd>
      </KbdGroup>
    </div>
  ),
};
