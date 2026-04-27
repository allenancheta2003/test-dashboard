"use client";
import { useEffect, useRef } from "react";
import { fmt } from "@/lib/analytics";

declare const Chart: any;

interface ChartProps {
  type: "bar" | "line";
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
  height?: number;
  yFormatter?: (v: number) => string;
}

export default function AnalyticsChart({ type, labels, datasets, height = 220, yFormatter }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);

  useEffect(() => {
    const init = () => {
      if (!canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const textColor = "rgba(255,255,255,0.4)";
      const gridColor = "rgba(255,255,255,0.06)";
      chartRef.current = new Chart(canvasRef.current, {
        type,
        data: {
          labels,
          datasets: datasets.map(ds => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.color + (type === "bar" ? "66" : "18"),
            borderColor: ds.color,
            borderWidth: 2,
            borderRadius: type === "bar" ? 4 : 0,
            fill: type === "line",
            tension: 0.35,
            pointBackgroundColor: ds.color,
            pointRadius: type === "line" ? 3 : 0,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: datasets.length > 1,
              labels: { color: textColor, font: { size: 11 }, boxWidth: 12, padding: 14 },
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `${ctx.dataset.label}: ${yFormatter ? yFormatter(ctx.raw) : fmt(ctx.raw)}`,
              },
            },
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, autoSkip: false, maxRotation: 35 } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: (v: number) => yFormatter ? yFormatter(v) : fmt(v) } },
          },
        },
      });
    };

    if (typeof Chart !== "undefined") {
      init();
    } else {
      const existing = document.getElementById("chartjs-cdn");
      if (existing) { existing.addEventListener("load", init); return; }
      const script = document.createElement("script");
      script.id = "chartjs-cdn";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = init;
      document.head.appendChild(script);
    }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [type, JSON.stringify(labels), JSON.stringify(datasets)]);

  return (
    <div style={{ position: "relative", width: "100%", height, marginBottom: 8 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
