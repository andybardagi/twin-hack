import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

const meta = {
  title: "Components/Alert",
  component: Alert,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
  args: {
    variant: "default",
  },
  render: (args) => (
    <Alert {...args} className="w-96">
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        This is an alert message that gives the user some important information.
      </AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = {
  args: { variant: "destructive" },
};

export const WithIcon: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <InfoIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        This is an alert message that gives the user some important information.
      </AlertDescription>
    </Alert>
  ),
};

export const DestructiveWithIcon: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args} className="w-96">
      <AlertTriangleIcon />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>Your changes could not be saved. Please try again.</AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>A new version is ready to install.</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Update
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <InfoIcon />
      <AlertTitle>This is a title-only alert.</AlertTitle>
    </Alert>
  ),
};
