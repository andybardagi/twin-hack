import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@workspace/ui/components/bubble";

const meta = {
  title: "Components/Bubble",
  component: Bubble,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"],
    },
    align: {
      control: "select",
      options: ["start", "end"],
    },
  },
  args: {
    variant: "default",
    align: "start",
    children: <BubbleContent>Hello there! How can I help you today?</BubbleContent>,
  },
} satisfies Meta<typeof Bubble>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Muted: Story = {
  args: { variant: "muted" },
};

export const Tinted: Story = {
  args: { variant: "tinted" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
};

export const AlignEnd: Story = {
  args: {
    align: "end",
    children: <BubbleContent>Sent from the current user, aligned to the end.</BubbleContent>,
  },
};

export const WithReactions: Story = {
  render: (args) => (
    <Bubble {...args} className="relative">
      <BubbleContent>Great news, the build passed!</BubbleContent>
      <BubbleReactions>👍 2</BubbleReactions>
    </Bubble>
  ),
};

export const WithReactionsOnTop: Story = {
  render: (args) => (
    <Bubble {...args} className="relative">
      <BubbleContent>Great news, the build passed!</BubbleContent>
      <BubbleReactions side="top">👍 2</BubbleReactions>
    </Bubble>
  ),
};

export const Conversation: Story = {
  render: () => (
    <BubbleGroup>
      <Bubble variant="muted" align="start">
        <BubbleContent>Hey, is the deploy ready?</BubbleContent>
      </Bubble>
      <Bubble variant="default" align="end">
        <BubbleContent>Yes, just shipped it.</BubbleContent>
      </Bubble>
      <Bubble variant="destructive" align="start">
        <BubbleContent>Actually, one test is failing.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
};
