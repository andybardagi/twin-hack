import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { Button } from "@workspace/ui/components/button";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>Make changes to your profile here.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Save changes</Button>
          <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Closed: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>Make changes to your profile here.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Save changes</Button>
          <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithSwipeHandle: Story = {
  render: () => (
    <Drawer defaultOpen showSwipeHandle>
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Swipe to dismiss</DrawerTitle>
          <DrawerDescription>Drag the handle down to close this drawer.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Top: Story = {
  render: () => (
    <Drawer defaultOpen swipeDirection="up">
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Top drawer</DrawerTitle>
          <DrawerDescription>This drawer slides in from the top of the screen.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Left: Story = {
  render: () => (
    <Drawer defaultOpen swipeDirection="left">
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Left drawer</DrawerTitle>
          <DrawerDescription>
            This drawer slides in from the left edge of the screen.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Right: Story = {
  render: () => (
    <Drawer defaultOpen swipeDirection="right">
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Right drawer</DrawerTitle>
          <DrawerDescription>
            This drawer slides in from the right edge of the screen.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const NonModal: Story = {
  render: () => (
    <Drawer defaultOpen modal={false}>
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Non-modal drawer</DrawerTitle>
          <DrawerDescription>
            You can still interact with the rest of the page while this drawer is open.
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithSnapPoints: Story = {
  render: () => (
    <Drawer defaultOpen snapPoints={[0.4, 1]}>
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Snap points</DrawerTitle>
          <DrawerDescription>
            This drawer supports snapping to 40% and 100% of the viewport height.
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
};
