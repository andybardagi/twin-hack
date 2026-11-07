import type { Meta, StoryObj } from "@storybook/react-vite";

import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";

const meta = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "default",
    size: "default",
    orientation: "horizontal",
    multiple: false,
    disabled: false,
  },
  render: (args) => (
    <ToggleGroup {...args} defaultValue={["bold"]}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        B
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        I
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        U
      </ToggleGroupItem>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
};

export const Multiple: Story = {
  args: { multiple: true },
  render: (args) => (
    <ToggleGroup {...args} defaultValue={["bold", "italic"]}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        B
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        I
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        U
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const ConnectedNoSpacing: Story = {
  args: { spacing: 0, variant: "outline" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
