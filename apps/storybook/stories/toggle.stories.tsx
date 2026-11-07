import type { Meta, StoryObj } from "@storybook/react-vite";

import { Toggle } from "@workspace/ui/components/toggle";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
    disabled: { control: "boolean" },
    defaultPressed: { control: "boolean" },
  },
  args: {
    children: "Bold",
    variant: "default",
    size: "default",
    disabled: false,
    defaultPressed: false,
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const Pressed: Story = {
  args: { defaultPressed: true },
};

export const OutlinePressed: Story = {
  args: { variant: "outline", defaultPressed: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
