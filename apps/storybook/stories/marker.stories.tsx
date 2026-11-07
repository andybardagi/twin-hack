import type { Meta, StoryObj } from "@storybook/react-vite";

import { Marker, MarkerContent, MarkerIcon } from "@workspace/ui/components/marker";

function ClockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

const meta = {
  title: "Components/Marker",
  component: Marker,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "separator", "border"],
    },
  },
  args: {
    variant: "default",
    children: "Today",
  },
} satisfies Meta<typeof Marker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Separator: Story = {
  args: { variant: "separator" },
};

export const Border: Story = {
  args: { variant: "border" },
};

export const WithIcon: Story = {
  render: (args) => (
    <Marker {...args}>
      <MarkerIcon>
        <ClockIcon />
      </MarkerIcon>
      <MarkerContent>Delivered at 3:45 PM</MarkerContent>
    </Marker>
  ),
};

export const SeparatorWithContent: Story = {
  render: (args) => (
    <Marker {...args} variant="separator">
      <MarkerContent>New messages</MarkerContent>
    </Marker>
  ),
};

export const BorderWithIconAndContent: Story = {
  render: (args) => (
    <Marker {...args} variant="border">
      <MarkerIcon>
        <ClockIcon />
      </MarkerIcon>
      <MarkerContent>Conversation started</MarkerContent>
    </Marker>
  ),
};

export const AsLink: Story = {
  name: "As Link (render prop)",
  render: (args) => (
    <Marker {...args} render={<a href="#" />}>
      <MarkerContent>View full history</MarkerContent>
    </Marker>
  ),
};
