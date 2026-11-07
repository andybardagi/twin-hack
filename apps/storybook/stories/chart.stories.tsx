import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: { label: "Desktop", color: "var(--color-chart-1)" },
  mobile: { label: "Mobile", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

function DesktopIcon() {
  return <span className="block size-2.5 rounded-full bg-(--color-desktop)" />;
}

function MobileIcon() {
  return <span className="block size-2.5 rounded-sm bg-(--color-mobile)" />;
}

const chartConfigWithIcons = {
  desktop: { label: "Desktop", color: "var(--color-chart-1)", icon: DesktopIcon },
  mobile: { label: "Mobile", color: "var(--color-chart-2)", icon: MobileIcon },
} satisfies ChartConfig;

const meta = {
  title: "Components/Chart",
  component: ChartContainer,
  args: {
    config: chartConfig,
    children: (
      <BarChart data={chartData}>
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    ),
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-64 w-96">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const LineChartExample: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-64 w-96">
      <LineChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line dataKey="desktop" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
        <Line dataKey="mobile" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  ),
};

export const DashedIndicator: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-64 w-96">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const HideLabel: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-64 w-96">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const HideIndicator: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-64 w-96">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const LegendTop: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-64 w-96">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartLegend verticalAlign="top" content={<ChartLegendContent verticalAlign="top" />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const LegendWithIcons: Story = {
  render: () => (
    <ChartContainer config={chartConfigWithIcons} className="h-64 w-96">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const LegendHideIcon: Story = {
  render: () => (
    <ChartContainer config={chartConfigWithIcons} className="h-64 w-96">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartLegend content={<ChartLegendContent hideIcon />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
