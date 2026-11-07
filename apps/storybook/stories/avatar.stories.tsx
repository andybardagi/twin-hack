import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@workspace/ui/components/avatar";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
  args: {
    size: "default",
  },
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="Jane Cooper" />
      <AvatarFallback>JC</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: "sm" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const Fallback: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://broken-image-url.invalid/avatar.png" alt="Jane Cooper" />
      <AvatarFallback>JC</AvatarFallback>
    </Avatar>
  ),
};

export const WithBadge: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="Jane Cooper" />
      <AvatarFallback>JC</AvatarFallback>
      <AvatarBadge>
        <CheckIcon />
      </AvatarBadge>
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="Jane Cooper" />
        <AvatarFallback>JC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/150?img=13" alt="Alex Rivera" />
        <AvatarFallback>AR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/150?img=14" alt="Sam Lee" />
        <AvatarFallback>SL</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  ),
};
