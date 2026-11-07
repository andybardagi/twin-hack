import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

const meta = {
  title: "Components/NativeSelect",
  component: NativeSelect,
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    size: "default",
    disabled: false,
  },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
    </NativeSelect>
  ),
} satisfies Meta<typeof NativeSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: "sm" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithOptionGroups: Story = {
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOptGroup label="Fruits">
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
        <NativeSelectOption value="banana">Banana</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Vegetables">
        <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
        <NativeSelectOption value="potato">Potato</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
};

export const WithDisabledOption: Story = {
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana" disabled>
        Banana (out of stock)
      </NativeSelectOption>
      <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
    </NativeSelect>
  ),
};
