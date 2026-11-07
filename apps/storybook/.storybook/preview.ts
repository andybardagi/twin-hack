import type { Preview } from "@storybook/react-vite";

import "@workspace/ui/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
  },
  globalTypes: {
    theme: {
      description: "Color scheme applied to the preview",
      toolbar: {
        title: "Theme",
        icon: "sun",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      document.documentElement.classList.toggle("dark", context.globals.theme === "dark");

      return Story();
    },
  ],
};

export default preview;
