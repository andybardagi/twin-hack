import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@workspace/ui/components/button-group";

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Bold</Button>
      <Button variant="outline">Italic</Button>
      <Button variant="outline">Underline</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </ButtonGroup>
  ),
};

export const WithSeparator: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Cut</Button>
      <Button variant="outline">Copy</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Paste</Button>
    </ButtonGroup>
  ),
};

export const WithText: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroupText>Page 1 of 4</ButtonGroupText>
      <Button variant="outline">Prev</Button>
      <Button variant="outline">Next</Button>
    </ButtonGroup>
  ),
};

export const Nested: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup>
        <Button variant="outline">A</Button>
        <Button variant="outline">B</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">C</Button>
        <Button variant="outline">D</Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
};

export const WithDisabledButton: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Save</Button>
      <Button variant="outline" disabled>
        Publish
      </Button>
    </ButtonGroup>
  ),
};
