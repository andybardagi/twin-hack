import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "@workspace/ui/components/spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  args: {
    className: "size-4",
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { className: "size-3" },
};

export const Large: Story = {
  args: { className: "size-6" },
};

export const ExtraLarge: Story = {
  args: { className: "size-8" },
};

export const Muted: Story = {
  args: { className: "size-4 text-muted-foreground" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      Loading...
    </div>
  ),
};
