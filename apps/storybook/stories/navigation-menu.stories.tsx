import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu";

const meta = {
  title: "Components/NavigationMenu",
  component: NavigationMenu,
  argTypes: {
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
  },
  args: {
    align: "start",
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-1">
              <li>
                <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#automation">Automation</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#reporting">Reporting</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[220px] gap-1">
              <li>
                <NavigationMenuLink href="#about">About</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#careers">Careers</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing" className={navigationMenuTriggerStyle()}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

export const SingleDropdown: Story = {
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[260px] gap-1">
              <li>
                <NavigationMenuLink href="#docs">Documentation</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#blog">Blog</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#support">Support</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

export const PlainLinksOnly: Story = {
  name: "Plain links (no dropdowns)",
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#home" className={navigationMenuTriggerStyle()}>
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing" className={navigationMenuTriggerStyle()}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#contact" className={navigationMenuTriggerStyle()}>
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

export const ActiveLink: Story = {
  name: "Active link state",
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#home" className={navigationMenuTriggerStyle()}>
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#dashboard" active className={navigationMenuTriggerStyle()}>
            Dashboard
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

export const WithIndicator: Story = {
  name: "With active-trigger indicator",
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[220px] gap-1">
              <li>
                <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#automation">Automation</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
          <NavigationMenuIndicator />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

export const AlignEnd: Story = {
  name: "Popup alignment: end",
  args: { align: "end" },
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[220px] gap-1">
              <li>
                <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#automation">Automation</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
