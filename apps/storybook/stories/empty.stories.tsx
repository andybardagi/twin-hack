import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Button } from "@workspace/ui/components/button";

function InboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

const meta = {
  title: "Components/Empty",
  component: Empty,
} satisfies Meta<typeof Empty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filters to find what you are looking for.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const DefaultMedia: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>Nothing here yet</EmptyTitle>
        <EmptyDescription>Create your first item to get started.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const WithoutMedia: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No notifications</EmptyTitle>
        <EmptyDescription>You are all caught up.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No projects</EmptyTitle>
        <EmptyDescription>Get started by creating a new project.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Create project</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const WithLinkInDescription: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>Access restricted</EmptyTitle>
        <EmptyDescription>
          Contact your administrator or <a href="#">read the docs</a> to request access.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
