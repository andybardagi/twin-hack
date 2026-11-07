import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress, ProgressLabel, ProgressValue } from "@workspace/ui/components/progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  argTypes: {
    value: { control: { type: "number", min: 0, max: 100 } },
  },
  args: {
    value: 50,
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Progress {...args} className="w-64" />,
};

export const Empty: Story = {
  args: { value: 0 },
  render: (args) => <Progress {...args} className="w-64" />,
};

export const Complete: Story = {
  args: { value: 100 },
  render: (args) => <Progress {...args} className="w-64" />,
};

export const Indeterminate: Story = {
  args: { value: null },
  render: (args) => <Progress {...args} className="w-64" />,
};

export const WithLabelAndValue: Story = {
  render: (args) => (
    <Progress {...args} className="w-64">
      <ProgressLabel>Uploading</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};
