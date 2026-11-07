import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  argTypes: {
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    multiple: false,
    disabled: false,
  },
  render: (args) => (
    <Accordion {...args} className="w-80">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Base UI?</AccordionTrigger>
        <AccordionContent>
          Base UI is a library of unstyled, accessible UI primitives for building React
          applications.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          No, Base UI ships without styles. This design system layers Tailwind utilities and cva
          variants on top of the primitives.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can items be disabled?</AccordionTrigger>
        <AccordionContent>
          Yes, the whole accordion or individual items can be disabled to prevent interaction.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultOpen: Story = {
  args: { defaultValue: ["item-1"] },
};

export const Multiple: Story = {
  args: { multiple: true, defaultValue: ["item-1", "item-2"] },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ["item-1"] },
};
