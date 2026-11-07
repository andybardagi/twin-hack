import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  argTypes: {
    defaultOpen: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    defaultOpen: false,
    disabled: false,
  },
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Collapsible {...args} className="w-72">
      <CollapsibleTrigger render={<Button variant="outline" />}>Toggle details</CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border p-3 text-sm">
        Additional details are revealed here once the trigger is activated.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Open: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Collapsible {...args} className="w-72">
      <CollapsibleTrigger render={<Button variant="outline" />}>Toggle details</CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border p-3 text-sm">
        This panel starts open because `defaultOpen` is `true`.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Collapsible {...args} className="w-72">
      <CollapsibleTrigger render={<Button variant="outline" />}>Toggle details</CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border p-3 text-sm">
        This trigger ignores user interaction while `disabled` is `true`.
      </CollapsibleContent>
    </Collapsible>
  ),
};
