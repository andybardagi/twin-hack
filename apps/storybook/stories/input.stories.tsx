import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@workspace/ui/components/input";

const meta = {
  title: "Components/Input",
  component: Input,
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url", "file"],
    },
    disabled: { control: "boolean" },
    "aria-invalid": { control: "boolean" },
  },
  args: {
    type: "text",
    placeholder: "Email",
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "hello@example.com" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password", defaultValue: "hunter2" },
};

export const Number: Story = {
  args: { type: "number", placeholder: "0", defaultValue: "42" },
};

export const Search: Story = {
  args: { type: "search", placeholder: "Search…" },
};

export const File: Story = {
  args: { type: "file" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Can't touch this" },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "invalid-email" },
};
