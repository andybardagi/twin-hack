import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";

function SheetDemo({
  side = "right",
  showCloseButton = true,
  defaultOpen = true,
}: {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
  defaultOpen?: boolean;
}) {
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
      <SheetContent side={side} showCloseButton={showCloseButton}>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when finished.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const meta = {
  title: "Components/Sheet",
  component: SheetDemo,
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    showCloseButton: { control: "boolean" },
    defaultOpen: { control: "boolean" },
  },
  args: {
    side: "right",
    showCloseButton: true,
    defaultOpen: true,
  },
} satisfies Meta<typeof SheetDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Left: Story = {
  args: { side: "left" },
};

export const Top: Story = {
  args: { side: "top" },
};

export const Bottom: Story = {
  args: { side: "bottom" },
};

export const WithoutCloseButton: Story = {
  args: { showCloseButton: false },
};

export const Closed: Story = {
  args: { defaultOpen: false },
};
