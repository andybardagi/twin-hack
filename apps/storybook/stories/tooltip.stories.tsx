import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent side="bottom">Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const Left: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent side="left">Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const Right: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent side="right">Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const InlineStart: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent side="inline-start">Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const InlineEnd: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent side="inline-end">Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const AlignStart: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent align="start">Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const AlignEnd: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent align="end">Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const DisabledTrigger: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger disabled render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Add to library</TooltipContent>
    </Tooltip>
  ),
};

export const MultipleTriggers: Story = {
  render: (args) => (
    <div className="flex gap-2">
      <Tooltip {...args}>
        <TooltipTrigger render={<Button variant="outline">Save</Button>} />
        <TooltipContent>Save your changes</TooltipContent>
      </Tooltip>
      <Tooltip {...args}>
        <TooltipTrigger render={<Button variant="outline">Delete</Button>} />
        <TooltipContent>Delete this item</TooltipContent>
      </Tooltip>
    </div>
  ),
};
