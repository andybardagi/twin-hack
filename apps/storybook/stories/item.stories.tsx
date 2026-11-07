import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@workspace/ui/components/item";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

const meta = {
  title: "Components/Item",
  component: Item,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "muted"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "xs"],
    },
  },
  args: {
    variant: "default",
    size: "default",
  },
  render: (args) => (
    <Item {...args} className="max-w-md">
      <ItemMedia variant="icon">
        <UserIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Jane Doe</ItemTitle>
        <ItemDescription>jane@example.com</ItemDescription>
      </ItemContent>
    </Item>
  ),
} satisfies Meta<typeof Item>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Muted: Story = {
  args: { variant: "muted" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const ExtraSmall: Story = {
  args: { size: "xs" },
};

export const WithIconMedia: Story = {
  render: () => (
    <Item className="max-w-md" variant="outline">
      <ItemMedia variant="icon">
        <UserIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Jane Doe</ItemTitle>
        <ItemDescription>Product designer</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithImageMedia: Story = {
  render: () => (
    <Item className="max-w-md" variant="outline">
      <ItemMedia variant="image">
        <img src="https://placehold.co/80x80" alt="" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Rotterdam Station</ItemTitle>
        <ItemDescription>Signage typography reference photo.</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Item className="max-w-md" variant="outline">
      <ItemMedia variant="icon">
        <UserIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Jane Doe</ItemTitle>
        <ItemDescription>jane@example.com</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          Message
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Item render={<a href="https://example.com" />} className="max-w-md" variant="outline">
      <ItemMedia variant="icon">
        <UserIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>View profile</ItemTitle>
        <ItemDescription>Renders as an anchor element via the render prop.</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <Item className="max-w-md" variant="outline" size="sm">
      <ItemHeader>
        <ItemTitle>Weekly report</ItemTitle>
        <span className="text-xs text-muted-foreground">Aug 1</span>
      </ItemHeader>
      <ItemContent>
        <ItemDescription>Your team completed 12 tasks this week.</ItemDescription>
      </ItemContent>
      <ItemFooter>
        <Button variant="ghost" size="sm">
          Dismiss
        </Button>
        <Button size="sm">View report</Button>
      </ItemFooter>
    </Item>
  ),
};

export const Group: Story = {
  render: () => (
    <ItemGroup className="max-w-md">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Jane Doe</ItemTitle>
          <ItemDescription>jane@example.com</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>John Smith</ItemTitle>
          <ItemDescription>john@example.com</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};

export const GroupWithSeparator: Story = {
  render: () => (
    <ItemGroup className="max-w-md">
      <Item>
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Jane Doe</ItemTitle>
          <ItemDescription>jane@example.com</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>John Smith</ItemTitle>
          <ItemDescription>john@example.com</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
