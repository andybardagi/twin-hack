import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Calendar } from "@workspace/ui/components/calendar";

const referenceDate = new Date(2026, 0, 15);

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  argTypes: {
    buttonVariant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    captionLayout: {
      control: "select",
      options: ["label", "dropdown", "dropdown-months", "dropdown-years"],
    },
    showOutsideDays: { control: "boolean" },
  },
  args: {
    mode: "single",
    selected: referenceDate,
    defaultMonth: referenceDate,
    buttonVariant: "ghost",
    captionLayout: "label",
    showOutsideDays: true,
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    function DefaultCalendar() {
      const [selected, setSelected] = React.useState<Date | undefined>(referenceDate);

      return (
        <Calendar
          {...args}
          mode="single"
          selected={selected}
          onSelect={setSelected}
          defaultMonth={referenceDate}
        />
      );
    }

    return <DefaultCalendar />;
  },
};

export const Multiple: Story = {
  render: () => {
    function MultipleCalendar() {
      const [selected, setSelected] = React.useState<Date[] | undefined>([
        referenceDate,
        new Date(2026, 0, 18),
        new Date(2026, 0, 22),
      ]);

      return (
        <Calendar
          mode="multiple"
          selected={selected}
          onSelect={setSelected}
          defaultMonth={referenceDate}
        />
      );
    }

    return <MultipleCalendar />;
  },
};

export const Range: Story = {
  render: () => {
    function RangeCalendar() {
      const [selected, setSelected] = React.useState<
        { from: Date | undefined; to?: Date | undefined } | undefined
      >({ from: referenceDate, to: new Date(2026, 0, 22) });

      return (
        <Calendar
          mode="range"
          selected={selected}
          onSelect={setSelected}
          defaultMonth={referenceDate}
        />
      );
    }

    return <RangeCalendar />;
  },
};

export const DropdownCaption: Story = {
  args: { captionLayout: "dropdown" },
};

export const OutsideDaysHidden: Story = {
  args: { showOutsideDays: false },
};

export const DisabledDates: Story = {
  args: {
    disabled: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
  },
};

export const ButtonVariantOutline: Story = {
  args: { buttonVariant: "outline" },
};
