import type { Meta, StoryObj } from "@storybook/react-vite";

import { AspectRatio } from "@workspace/ui/components/aspect-ratio";

const meta = {
  title: "Components/AspectRatio",
  component: AspectRatio,
  argTypes: {
    ratio: { control: "number" },
  },
  args: {
    ratio: 16 / 9,
  },
  render: (args) => (
    <div className="w-80">
      <AspectRatio {...args} className="overflow-hidden rounded-lg bg-muted">
        <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
          {args.ratio.toFixed(2)}:1
        </div>
      </AspectRatio>
    </div>
  ),
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Square: Story = {
  args: { ratio: 1 },
};

export const Portrait: Story = {
  args: { ratio: 3 / 4 },
};

export const Ultrawide: Story = {
  args: { ratio: 21 / 9 },
};

export const WithImage: Story = {
  render: (args) => (
    <div className="w-80">
      <AspectRatio {...args} className="overflow-hidden rounded-lg bg-muted">
        <img
          src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80"
          alt="Landscape"
          className="size-full object-cover"
        />
      </AspectRatio>
    </div>
  ),
};
