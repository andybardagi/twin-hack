import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">This is the popover content.</p>
      </PopoverContent>
    </Popover>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Show details</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

export const SideTop: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open on top</PopoverTrigger>
      <PopoverContent side="top">
        <p className="text-sm">Positioned above the trigger.</p>
      </PopoverContent>
    </Popover>
  ),
};

export const SideRight: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open on right</PopoverTrigger>
      <PopoverContent side="right">
        <p className="text-sm">Positioned to the right of the trigger.</p>
      </PopoverContent>
    </Popover>
  ),
};

export const SideLeft: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open on left</PopoverTrigger>
      <PopoverContent side="left">
        <p className="text-sm">Positioned to the left of the trigger.</p>
      </PopoverContent>
    </Popover>
  ),
};

export const AlignStart: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Align start</PopoverTrigger>
      <PopoverContent align="start">
        <p className="text-sm">Aligned to the start of the trigger.</p>
      </PopoverContent>
    </Popover>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline" />}>Already open</PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">This popover starts open by default.</p>
      </PopoverContent>
    </Popover>
  ),
};
