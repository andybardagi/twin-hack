import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const meta = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
};

export const Link: Story = {
  args: { variant: "link" },
};

export const ExtraSmall: Story = {
  args: { size: "xs" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const Icon: Story = {
  args: { size: "icon", children: <PlusIcon />, "aria-label": "Add" },
};

export const IconExtraSmall: Story = {
  args: { size: "icon-xs", children: <PlusIcon />, "aria-label": "Add" },
};

export const IconSmall: Story = {
  args: { size: "icon-sm", children: <PlusIcon />, "aria-label": "Add" },
};

export const IconLarge: Story = {
  args: { size: "icon-lg", children: <PlusIcon />, "aria-label": "Add" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
