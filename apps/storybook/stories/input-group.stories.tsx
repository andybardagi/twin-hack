import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  render: (args) => (
    <InputGroup {...args} className="max-w-sm">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search…" />
    </InputGroup>
  ),
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLeadingIcon: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <MailIcon />
      </InputGroupAddon>
      <InputGroupInput type="email" placeholder="you@example.com" />
    </InputGroup>
  ),
};

export const WithTrailingButton: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupInput placeholder="Search…" defaultValue="workspace" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Clear search">
          <XIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithLeadingAndTrailingAddons: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search…" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>⌘K</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithText: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
};

export const ButtonSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <InputGroup className="max-w-sm">
        <InputGroupInput placeholder="Extra small button" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="xs">Go</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="max-w-sm">
        <InputGroupInput placeholder="Small button" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="sm">Go</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="max-w-sm">
        <InputGroupInput placeholder="Icon extra small" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear">
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="max-w-sm">
        <InputGroupInput placeholder="Icon small" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-sm" aria-label="Clear">
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const BlockStartLabel: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon align="block-start">
        <InputGroupText>Card number</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="4242 4242 4242 4242" />
    </InputGroup>
  ),
};

export const BlockEndHint: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupInput placeholder="Password" type="password" />
      <InputGroupAddon align="block-end">
        <InputGroupText>Must be at least 8 characters.</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupTextarea placeholder="Write your message…" />
      <InputGroupAddon align="block-end">
        <InputGroupButton size="sm" className="ml-auto">
          Send
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <InputGroup className="max-w-sm has-disabled:opacity-50">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search…" disabled />
    </InputGroup>
  ),
};

export const Invalid: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <MailIcon />
      </InputGroupAddon>
      <InputGroupInput type="email" defaultValue="not-an-email" aria-invalid />
    </InputGroup>
  ),
};
