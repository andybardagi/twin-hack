import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@workspace/ui/components/badge";

function CheckIcon() {
  return (
    <svg
      data-icon="inline-start"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const meta = {
  title: "Components/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
  args: {
    children: "Badge",
    variant: "default",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Link: Story = {
  args: { variant: "link" },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <CheckIcon />
        Verified
      </>
    ),
  },
};

export const AsLink: Story = {
  args: {
    render: <a href="#" />,
    children: "Clickable badge",
  },
};
