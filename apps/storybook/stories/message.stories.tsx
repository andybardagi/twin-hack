import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@workspace/ui/components/message";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble";

const meta = {
  title: "Components/Message",
  component: Message,
  argTypes: {
    align: {
      control: "select",
      options: ["start", "end"],
    },
  },
  args: {
    align: "start",
  },
} satisfies Meta<typeof Message>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Message {...args} className="max-w-md">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <Bubble align={args.align}>
          <BubbleContent>Hi! How can I help you today?</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
};

export const AlignEnd: Story = {
  name: "Align End (outgoing message)",
  args: { align: "end" },
  render: (args) => (
    <Message {...args} className="max-w-md">
      <MessageContent>
        <Bubble align={args.align}>
          <BubbleContent>I need help resetting my password.</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: (args) => (
    <Message {...args} className="max-w-md">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Support Bot &middot; 9:41 AM</MessageHeader>
        <Bubble align={args.align}>
          <BubbleContent>Sure, I&apos;ve sent a reset link to your email.</BubbleContent>
        </Bubble>
        <MessageFooter>Read</MessageFooter>
      </MessageContent>
    </Message>
  ),
};

export const GhostVariant: Story = {
  name: "Ghost Bubble (transparent, no header padding)",
  render: (args) => (
    <Message {...args} className="max-w-md">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Support Bot</MessageHeader>
        <Bubble variant="ghost" align={args.align}>
          <BubbleContent>No background here, just plain text.</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
};

export const MessageGroupConversation: Story = {
  name: "Message Group (multiple consecutive messages)",
  render: (args) => (
    <MessageGroup className="max-w-md">
      <Message {...args}>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Support Bot &middot; 9:41 AM</MessageHeader>
          <Bubble align={args.align}>
            <BubbleContent>Hi! How can I help you today?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message {...args}>
        <MessageAvatar />
        <MessageContent>
          <Bubble align={args.align}>
            <BubbleContent>I&apos;m here whenever you&apos;re ready.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
};
