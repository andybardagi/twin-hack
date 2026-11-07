import type { Meta, StoryObj } from "@storybook/react-vite";

import { DirectionProvider } from "@workspace/ui/components/direction";

const meta = {
  title: "Components/Direction",
  component: DirectionProvider,
  argTypes: {
    direction: {
      control: "select",
      options: ["ltr", "rtl"],
    },
  },
  args: {
    direction: "ltr",
  },
} satisfies Meta<typeof DirectionProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ltr: Story = {
  args: { direction: "ltr" },
  render: (args) => (
    <DirectionProvider {...args}>
      <p className="text-sm">Left-to-right content.</p>
    </DirectionProvider>
  ),
};

export const Rtl: Story = {
  args: { direction: "rtl" },
  render: (args) => (
    <DirectionProvider {...args}>
      <p className="text-sm">Right-to-left content.</p>
    </DirectionProvider>
  ),
};
