import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slider } from "@workspace/ui/components/slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  argTypes: {
    disabled: { control: "boolean" },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    orientation: "horizontal",
  },
  decorators: [(Story) => <div className="w-64">{Story()}</div>],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Range: Story = {
  args: { defaultValue: [25, 75] },
};

export const CustomMinMaxStep: Story = {
  args: { min: 0, max: 10, step: 1, defaultValue: 5 },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledRange: Story = {
  args: { disabled: true, defaultValue: [25, 75] },
};

export const Vertical: Story = {
  args: { orientation: "vertical", defaultValue: 40 },
  decorators: [(Story) => <div className="h-56">{Story()}</div>],
};
