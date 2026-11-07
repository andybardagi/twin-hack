import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@workspace/ui/components/attachment";
import { Spinner } from "@workspace/ui/components/spinner";

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const meta = {
  title: "Components/Attachment",
  component: Attachment,
  argTypes: {
    state: {
      control: "select",
      options: ["idle", "uploading", "processing", "error", "done"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "xs"],
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    state: "done",
    size: "default",
    orientation: "horizontal",
  },
  render: (args) => (
    <Attachment {...args}>
      <AttachmentTrigger />
      <AttachmentMedia>
        <FileIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
        <AttachmentDescription>2.4 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove attachment">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
} satisfies Meta<typeof Attachment>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Idle: Story = {
  args: { state: "idle" },
  render: (args) => (
    <Attachment {...args}>
      <AttachmentTrigger />
      <AttachmentMedia>
        <FileIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>Drop file to upload</AttachmentTitle>
        <AttachmentDescription>Up to 10 MB</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
};

export const Uploading: Story = {
  args: { state: "uploading" },
  render: (args) => (
    <Attachment {...args}>
      <AttachmentMedia>
        <Spinner />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
        <AttachmentDescription>Uploading… 42%</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Cancel upload">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const Processing: Story = {
  args: { state: "processing" },
  render: (args) => (
    <Attachment {...args}>
      <AttachmentMedia>
        <Spinner />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
        <AttachmentDescription>Processing…</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
};

export const ErrorState: Story = {
  args: { state: "error" },
  render: (args) => (
    <Attachment {...args}>
      <AttachmentTrigger />
      <AttachmentMedia>
        <AlertIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
        <AttachmentDescription>Upload failed. Tap to retry.</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove attachment">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const ImageMedia: Story = {
  render: (args) => (
    <Attachment {...args}>
      <AttachmentTrigger />
      <AttachmentMedia variant="image">
        <img
          src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=200&q=80"
          alt="Preview"
        />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>landscape.jpg</AttachmentTitle>
        <AttachmentDescription>1.1 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove attachment">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const Small: Story = {
  args: { size: "sm" },
};

export const ExtraSmall: Story = {
  args: { size: "xs" },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <Attachment {...args}>
      <AttachmentTrigger />
      <AttachmentMedia variant="image">
        <img
          src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=200&q=80"
          alt="Preview"
        />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>landscape.jpg</AttachmentTitle>
        <AttachmentDescription>1.1 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove attachment">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const Group: Story = {
  render: (args) => (
    <AttachmentGroup>
      <Attachment {...args}>
        <AttachmentTrigger />
        <AttachmentMedia>
          <FileIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
          <AttachmentDescription>2.4 MB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment {...args} state="uploading">
        <AttachmentMedia>
          <Spinner />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>invoice.png</AttachmentTitle>
          <AttachmentDescription>Uploading…</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment {...args} state="error">
        <AttachmentTrigger />
        <AttachmentMedia>
          <AlertIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>notes.docx</AttachmentTitle>
          <AttachmentDescription>Upload failed</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>
  ),
};
