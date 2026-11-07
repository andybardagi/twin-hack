import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";

const meta = {
  title: "Components/Field",
  component: Field,
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel htmlFor="field-email">Email</FieldLabel>
      <Input id="field-email" type="email" placeholder="you@example.com" />
      <FieldDescription>We'll never share your email.</FieldDescription>
    </Field>
  ),
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Vertical: Story = {
  args: { orientation: "vertical" },
};

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
};

export const Responsive: Story = {
  args: { orientation: "responsive" },
};

export const WithTitleAndDescription: Story = {
  render: () => (
    <Field className="max-w-sm">
      <FieldContent>
        <FieldTitle>Push notifications</FieldTitle>
        <FieldDescription>Receive push notifications on your device.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Field data-invalid="true" className="max-w-sm">
      <FieldLabel htmlFor="field-invalid-email">Email</FieldLabel>
      <Input id="field-invalid-email" type="email" aria-invalid defaultValue="not-an-email" />
      <FieldError errors={[{ message: "Please enter a valid email address." }]} />
    </Field>
  ),
};

export const InvalidWithMultipleErrors: Story = {
  render: () => (
    <Field data-invalid="true" className="max-w-sm">
      <FieldLabel htmlFor="field-invalid-password">Password</FieldLabel>
      <Input id="field-invalid-password" type="password" aria-invalid />
      <FieldError
        errors={[
          { message: "Password must be at least 8 characters." },
          { message: "Password must contain a number." },
        ]}
      />
    </Field>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Field data-disabled="true" className="max-w-sm opacity-50">
      <FieldLabel htmlFor="field-disabled">Username</FieldLabel>
      <Input id="field-disabled" disabled defaultValue="jdoe" />
      <FieldDescription>You can't change your username right now.</FieldDescription>
    </Field>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="field-bio">Bio</FieldLabel>
      <Textarea id="field-bio" placeholder="Tell us about yourself" />
      <FieldDescription>Shown on your public profile.</FieldDescription>
    </Field>
  ),
};

export const FieldGroupExample: Story = {
  render: () => (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="fg-name">Name</FieldLabel>
        <Input id="fg-name" placeholder="Jane Doe" />
      </Field>
      <Field>
        <FieldLabel htmlFor="fg-email">Email</FieldLabel>
        <Input id="fg-email" type="email" placeholder="jane@example.com" />
      </Field>
    </FieldGroup>
  ),
};

export const FieldSetWithLegend: Story = {
  render: () => (
    <FieldSet className="max-w-sm">
      <FieldLegend>Contact information</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fs-name">Name</FieldLabel>
          <Input id="fs-name" placeholder="Jane Doe" />
        </Field>
        <Field>
          <FieldLabel htmlFor="fs-email">Email</FieldLabel>
          <Input id="fs-email" type="email" placeholder="jane@example.com" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};

export const FieldSetWithLabelVariantLegend: Story = {
  render: () => (
    <FieldSet className="max-w-sm">
      <FieldLegend variant="label">Notifications</FieldLegend>
      <FieldDescription>Choose what you want to be notified about.</FieldDescription>
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Email notifications</FieldTitle>
            <FieldDescription>Receive emails about your account activity.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="sep-email">Email</FieldLabel>
        <Input id="sep-email" type="email" placeholder="jane@example.com" />
      </Field>
      <FieldSeparator>Or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="sep-username">Username</FieldLabel>
        <Input id="sep-username" placeholder="jane_doe" />
      </Field>
    </FieldGroup>
  ),
};
