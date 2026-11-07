import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";

const tags = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-72 w-64 rounded-lg border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium">Items</h4>
        {tags.map((tag) => (
          <div key={tag} className="py-1 text-sm">
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 rounded-lg border whitespace-nowrap">
      <div className="flex gap-4 p-4">
        {tags.slice(0, 20).map((tag) => (
          <div
            key={tag}
            className="flex size-24 shrink-0 items-center justify-center rounded-md border text-sm"
          >
            {tag}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const Both: Story = {
  render: () => (
    <ScrollArea className="h-64 w-64 rounded-lg border">
      <div className="grid w-[600px] grid-cols-1 gap-2 p-4">
        {tags.map((tag) => (
          <div key={tag} className="w-[560px] rounded-md border p-2 text-sm">
            {tag}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};
