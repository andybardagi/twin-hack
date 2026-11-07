import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "@workspace/ui/components/separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => <div className="flex h-24 w-64 items-center justify-center">{Story()}</div>,
  ],
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  decorators: [
    (Story) => <div className="flex h-24 w-64 items-center justify-center">{Story()}</div>,
  ],
};

export const WithinContent: Story = {
  render: () => (
    <div className="w-64">
      <div className="space-y-1">
        <h4 className="text-sm leading-none font-medium">@workspace/ui</h4>
        <p className="text-sm text-muted-foreground">An open-source UI component library.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Blog</span>
        <Separator orientation="vertical" />
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
      </div>
    </div>
  ),
};
