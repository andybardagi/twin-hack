import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import { Toaster, toast } from "@workspace/ui/components/toast";

const meta = {
  title: "Components/Toast",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Event has been created",
            description: "Sunday, December 03, 2026 at 9:00 AM",
          })
        }
      >
        Show toast
      </Button>
      <Toaster />
    </div>
  ),
};

export const Success: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Success",
            description: "Your changes have been saved.",
            type: "success",
          })
        }
      >
        Show success toast
      </Button>
      <Toaster />
    </div>
  ),
};

export const ErrorToast: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Something went wrong",
            description: "Your changes could not be saved.",
            type: "error",
          })
        }
      >
        Show error toast
      </Button>
      <Toaster />
    </div>
  ),
};

export const Info: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Heads up",
            description: "A new version is available.",
            type: "info",
          })
        }
      >
        Show info toast
      </Button>
      <Toaster />
    </div>
  ),
};

export const Warning: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Careful",
            description: "This action cannot be undone.",
            type: "warning",
          })
        }
      >
        Show warning toast
      </Button>
      <Toaster />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Uploading file",
            description: "Please wait while your file is uploaded.",
            type: "loading",
            timeout: 0,
          })
        }
      >
        Show loading toast
      </Button>
      <Toaster />
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Item deleted",
            description: "The item was removed from your list.",
            actionProps: {
              children: "Undo",
              onClick: () => toast.add({ title: "Undo successful" }),
            },
          })
        }
      >
        Show toast with action
      </Button>
      <Toaster />
    </div>
  ),
};

export const Persistent: Story = {
  render: () => (
    <div>
      <Button
        onClick={() =>
          toast.add({
            title: "Persistent toast",
            description: "This toast will not auto-dismiss.",
            timeout: 0,
          })
        }
      >
        Show persistent toast
      </Button>
      <Toaster />
    </div>
  ),
};
