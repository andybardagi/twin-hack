import type { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "@workspace/ui/components/switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    size: "default",
    defaultChecked: false,
    disabled: false,
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const SmallChecked: Story = {
  args: { size: "sm", defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const WithLabel: Story = {
  render: (args) => (
    <label className="flex items-center gap-2 text-sm">
      <Switch {...args} />
      Airplane mode
    </label>
  ),
};
