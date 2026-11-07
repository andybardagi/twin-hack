import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="account" className="w-80">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here. Click save when you&apos;re done.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
      <TabsContent value="settings">Settings are disabled for this account.</TabsContent>
    </Tabs>
  ),
};

export const LineVariant: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="account" className="w-80">
      <TabsList variant="line">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here. Click save when you&apos;re done.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
      <TabsContent value="settings">Settings are disabled for this account.</TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <Tabs {...args} defaultValue="account" className="h-40 w-80">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here. Click save when you&apos;re done.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
      <TabsContent value="settings">Settings are disabled for this account.</TabsContent>
    </Tabs>
  ),
};

export const VerticalLineVariant: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <Tabs {...args} defaultValue="account" className="h-40 w-80">
      <TabsList variant="line">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here. Click save when you&apos;re done.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
      <TabsContent value="settings">Settings are disabled for this account.</TabsContent>
    </Tabs>
  ),
};
