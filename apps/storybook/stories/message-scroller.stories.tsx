import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@workspace/ui/components/message-scroller";
import { Message, MessageContent } from "@workspace/ui/components/message";
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble";

const sampleMessages = Array.from({ length: 16 }, (_, index) => ({
  id: `msg-${index + 1}`,
  align: index % 3 === 0 ? ("end" as const) : ("start" as const),
  text: `Message #${index + 1} — this is a sample chat entry used to demonstrate scrolling behavior.`,
}));

function ChatMessages() {
  return (
    <>
      {sampleMessages.map((message, index) => (
        <MessageScrollerItem
          key={message.id}
          messageId={message.id}
          scrollAnchor={index === sampleMessages.length - 1}
        >
          <Message align={message.align}>
            <MessageContent>
              <Bubble align={message.align}>
                <BubbleContent>{message.text}</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </MessageScrollerItem>
      ))}
    </>
  );
}

const meta = {
  title: "Components/MessageScroller",
  component: MessageScroller,
} satisfies Meta<typeof MessageScroller>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <MessageScrollerProvider>
      <MessageScroller className="h-80 w-96 rounded-lg border border-border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <ChatMessages />
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

export const ScrollToStartButton: Story = {
  name: "Scroll-to-start button",
  render: () => (
    <MessageScrollerProvider defaultScrollPosition="end">
      <MessageScroller className="h-80 w-96 rounded-lg border border-border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <ChatMessages />
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="start" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

export const BothScrollButtons: Story = {
  name: "Start and end scroll buttons",
  render: () => (
    <MessageScrollerProvider>
      <MessageScroller className="h-80 w-96 rounded-lg border border-border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <ChatMessages />
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="start" />
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

export const OutlineIconButton: Story = {
  name: "Custom button variant/size",
  render: () => (
    <MessageScrollerProvider>
      <MessageScroller className="h-80 w-96 rounded-lg border border-border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <ChatMessages />
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" variant="outline" size="icon-lg" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

export const AutoScrollDisabled: Story = {
  name: "Autoscroll disabled",
  render: () => (
    <MessageScrollerProvider autoScroll={false}>
      <MessageScroller className="h-80 w-96 rounded-lg border border-border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <ChatMessages />
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};

export const StartScrollPosition: Story = {
  name: "Default scroll position: start",
  render: () => (
    <MessageScrollerProvider defaultScrollPosition="start">
      <MessageScroller className="h-80 w-96 rounded-lg border border-border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <ChatMessages />
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};
