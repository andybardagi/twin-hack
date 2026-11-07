import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "@workspace/ui/components/textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    "aria-invalid": { control: "boolean" },
  },
  args: {
    placeholder: "Type your message here.",
    disabled: false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { "aria-invalid": true },
};

export const WithValue: Story = {
  args: { defaultValue: "This textarea already has some content in it." },
};
