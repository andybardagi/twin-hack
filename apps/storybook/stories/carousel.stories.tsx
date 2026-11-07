import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted text-4xl font-semibold">
      {children}
    </div>
  );
}

const meta = {
  title: "Components/Carousel",
  component: Carousel,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Carousel {...args} className="w-64">
      <CarouselContent>
        {[1, 2, 3, 4, 5].map((index) => (
          <CarouselItem key={index}>
            <Slide>{index}</Slide>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <Carousel {...args} className="h-64 w-64">
      <CarouselContent className="h-64">
        {[1, 2, 3, 4, 5].map((index) => (
          <CarouselItem key={index}>
            <Slide>{index}</Slide>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const MultipleSlidesPerView: Story = {
  render: (args) => (
    <Carousel {...args} opts={{ align: "start" }} className="w-96">
      <CarouselContent>
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <CarouselItem key={index} className="basis-1/3">
            <Slide>{index}</Slide>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const WithoutNavigation: Story = {
  render: (args) => (
    <Carousel {...args} className="w-64">
      <CarouselContent>
        {[1, 2, 3].map((index) => (
          <CarouselItem key={index}>
            <Slide>{index}</Slide>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  ),
};
