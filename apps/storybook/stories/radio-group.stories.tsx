import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "@workspace/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" className="max-w-xs">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="radio-default" />
        <Label htmlFor="radio-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="radio-comfortable" />
        <Label htmlFor="radio-comfortable">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="radio-compact" />
        <Label htmlFor="radio-compact">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Unchecked: Story = {
  render: () => (
    <RadioGroup className="max-w-xs">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="radio-unchecked-default" />
        <Label htmlFor="radio-unchecked-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="radio-unchecked-comfortable" />
        <Label htmlFor="radio-unchecked-comfortable">Comfortable</Label>
      </div>
    </RadioGroup>
  ),
};

export const DisabledGroup: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" disabled className="max-w-xs">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="radio-disabled-default" />
        <Label htmlFor="radio-disabled-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="radio-disabled-comfortable" />
        <Label htmlFor="radio-disabled-comfortable">Comfortable</Label>
      </div>
    </RadioGroup>
  ),
};

export const DisabledItem: Story = {
  render: () => (
    <RadioGroup defaultValue="default" className="max-w-xs">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="radio-item-default" />
        <Label htmlFor="radio-item-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="radio-item-comfortable" disabled />
        <Label htmlFor="radio-item-comfortable">Comfortable (disabled)</Label>
      </div>
    </RadioGroup>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" readOnly className="max-w-xs">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="radio-readonly-default" />
        <Label htmlFor="radio-readonly-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="radio-readonly-comfortable" />
        <Label htmlFor="radio-readonly-comfortable">Comfortable</Label>
      </div>
    </RadioGroup>
  ),
};
