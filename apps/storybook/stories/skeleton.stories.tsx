import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "@workspace/ui/components/skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  args: {
    className: "h-4 w-48",
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Circle: Story = {
  args: { className: "size-12 rounded-full" },
};

export const Text: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-4 w-40" />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  ),
};
