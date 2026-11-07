import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "@workspace/ui/components/checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  argTypes: {
    checked: { control: "boolean" },
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    indeterminate: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
  args: {
    defaultChecked: false,
    disabled: false,
    indeterminate: false,
    required: false,
    readOnly: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Required: Story = {
  args: { required: true },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultChecked: true },
};

export const WithLabel: Story = {
  render: (args) => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox {...args} />
      Accept terms and conditions
    </label>
  ),
};
