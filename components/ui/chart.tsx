"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// --- Payload type for tooltip and legend ---
interface PayloadItem {
  name?: string;
  value?: number;
  dataKey?: string;
  color?: string;
  fill?: string;
  payload?: Record<string, any>;
}

// --- Chart theme config ---
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context)
    throw new Error("useChart must be used within <ChartContainer />");
  return context;
}

// --- Chart Container ---
function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

// --- Chart CSS Variables for theme/color ---
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, c]) => c.theme || c.color,
  );
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

// --- Chart Tooltip ---
const ChartTooltip = RechartsPrimitive.Tooltip;

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string | number;
  labelKey?: string;
  nameKey?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  className?: string;
  formatter?: (
    value: any,
    name?: string,
    item?: PayloadItem,
    index?: number,
    payload?: PayloadItem[],
  ) => React.ReactNode;
  labelFormatter?: (label: any, payload?: PayloadItem[]) => React.ReactNode;
  labelClassName?: string;
  color?: string;
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelKey,
  nameKey,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  className,
  formatter,
  labelFormatter,
  labelClassName,
  color,
}: ChartTooltipContentProps) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className={cn("tooltip-container", className)}>
      {payload.map((item, index) => {
        const key = `${nameKey || item.name || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        const indicatorColor = color || item.fill || item.color;

        return (
          <div key={index} className="flex gap-2 items-center">
            {!hideIndicator && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: indicatorColor }}
              />
            )}
            <span>{itemConfig?.label || item.name}</span>
            {item.value !== undefined && (
              <span>{item.value.toLocaleString()}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Chart Legend ---
const ChartLegend = RechartsPrimitive.Legend;

interface ChartLegendContentProps {
  payload?: PayloadItem[];
  verticalAlign?: "top" | "middle" | "bottom";
  hideIcon?: boolean;
  nameKey?: string;
  className?: string;
}

function ChartLegendContent({
  payload,
  verticalAlign = "bottom",
  hideIcon = false,
  nameKey,
  className,
}: ChartLegendContentProps) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div
      className={cn(
        "flex gap-4 items-center justify-center",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload.map((item, index) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div key={index} className="flex items-center gap-1.5">
            {!hideIcon ? (
              itemConfig?.icon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: item.color }}
                />
              )
            ) : null}
            <span>{itemConfig?.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Helper ---
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: PayloadItem,
  key: string,
) {
  if (!payload || typeof payload !== "object") return undefined;
  const payloadPayload =
    payload.payload && typeof payload.payload === "object"
      ? payload.payload
      : undefined;

  const configKey =
    key in payload
      ? (payload[key as keyof typeof payload] as string)
      : payloadPayload && key in payloadPayload
        ? (payloadPayload[key as keyof typeof payloadPayload] as string)
        : key;

  return config[configKey as keyof typeof config];
}

// --- Exports ---
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
