import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const meta = {
  title: "Components/Label",
  component: Label,
  argTypes: {
    htmlFor: { control: "text" },
    children: { control: "text" },
  },
  args: {
    children: "Email address",
    htmlFor: "email",
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFormControl: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Label {...args} />
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <Label {...args}>
      <MailIcon className="size-4" />
      {args.children}
    </Label>
  ),
};

export const PeerDisabled: Story = {
  name: "Peer Disabled (sibling input disabled)",
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Input id="email-disabled" className="peer" disabled defaultValue="you@example.com" />
      <Label {...args} htmlFor="email-disabled" />
    </div>
  ),
};

export const GroupDisabled: Story = {
  name: "Group Disabled (data-disabled on ancestor)",
  render: (args) => (
    <div className="group flex flex-col gap-2" data-disabled="true">
      <Label {...args} />
      <Input id="email-group-disabled" disabled defaultValue="you@example.com" />
    </div>
  ),
};
