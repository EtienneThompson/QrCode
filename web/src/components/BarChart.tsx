import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

/** Reads the chart color tokens from CSS, re-reading when the color scheme flips. */
function useChartColors() {
  const read = () => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    return {
      bar: v("--series-1"),
      barHover: v("--series-1-hover"),
      grid: v("--grid"),
      text: v("--text-secondary"),
    };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setColors(read());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return colors;
}

interface Props {
  labels: string[];
  values: number[];
  /** Accessible description of what the chart shows. */
  ariaLabel: string;
  height?: number;
  /** Tooltip label, e.g. (n) => `${n} scans`. */
  formatValue?: (n: number) => string;
}

export default function BarChart({
  labels,
  values,
  ariaLabel,
  height = 260,
  formatValue = (n) => `${n.toLocaleString()} scan${n === 1 ? "" : "s"}`,
}: Props) {
  const colors = useChartColors();

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: { label: (ctx) => formatValue(ctx.parsed.y ?? 0) },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: colors.grid },
        ticks: { color: colors.text, maxRotation: 0, autoSkip: true, autoSkipPadding: 16 },
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.grid },
        border: { display: false },
        ticks: { color: colors.text, precision: 0, maxTicksLimit: 6 },
      },
    },
  };

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <Bar
        options={options}
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors.bar,
              hoverBackgroundColor: colors.barHover,
              borderRadius: { topLeft: 4, topRight: 4 },
              borderSkipped: "bottom",
              maxBarThickness: 24,
              categoryPercentage: 0.85,
              barPercentage: 1,
            },
          ],
        }}
      />
    </div>
  );
}
