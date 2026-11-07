import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160"><rect width="100%" height="100%" fill="%23a3a3a3"/></svg>',
  );

const meta = {
  title: "Components/Card",
  component: Card,
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
  args: {
    size: "default",
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Project Alpha</CardTitle>
        <CardDescription>A short summary of the project status.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>The build is currently passing and the last deploy went out five minutes ago.</p>
      </CardContent>
    </Card>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage how you receive alerts.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Email and push notifications are currently enabled.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Upgrade plan</CardTitle>
        <CardDescription>Unlock more storage and features.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Your current plan expires in 12 days.</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm">
          Dismiss
        </Button>
        <Button size="sm">Upgrade</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  args: { size: "sm" },
  render: (args) => (
    <Card {...args} className="w-72">
      <CardHeader>
        <CardTitle>Compact card</CardTitle>
        <CardDescription>Uses the smaller spacing variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Less padding between sections.</p>
      </CardContent>
    </Card>
  ),
};

export const WithImage: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <img src={placeholderImage} alt="" className="w-full" />
      <CardHeader>
        <CardTitle>Scenic overlook</CardTitle>
        <CardDescription>Photo of the week.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Taken from the north trail at sunrise.</p>
      </CardContent>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardContent>
        <p>A minimal card with only a content section, no header or footer.</p>
      </CardContent>
    </Card>
  ),
};
