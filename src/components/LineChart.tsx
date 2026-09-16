"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface Props {
  series: { name: string; data: [string, number][] }[];
  height?: number;
  yFormat?: (v: number) => string;
}

/** Gráfico de linhas editorial — ECharts, sem chrome desnecessário. */
export function LineChart({ series, height = 360, yFormat }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    chart.setOption({
      animation: !reduced,
      grid: { left: 48, right: 16, top: 32, bottom: 28 },
      tooltip: {
        trigger: "axis",
        textStyle: { fontFamily: "IBM Plex Mono" },
        borderColor: "#c6bb9f",
        backgroundColor: "#fffdf8",
      },
      legend: { top: 0, textStyle: { color: "#4c4437" } },
      xAxis: {
        type: "time",
        axisLine: { lineStyle: { color: "#c6bb9f" } },
        axisLabel: { color: "#847a64", fontFamily: "IBM Plex Mono", fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: {
          color: "#847a64",
          fontFamily: "IBM Plex Mono",
          fontSize: 11,
          formatter: yFormat ? (v: number) => yFormat(v) : undefined,
        },
        splitLine: { lineStyle: { color: "#e6dfcf" } },
      },
      series: series.map((s, i) => ({
        type: "line",
        name: s.name,
        data: s.data,
        showSymbol: false,
        lineStyle: { width: 2, color: i === 0 ? "#14532d" : "#b3401e" },
        itemStyle: { color: i === 0 ? "#14532d" : "#b3401e" },
        emphasis: { disabled: true },
      })),
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [series, yFormat]);

  return <div ref={ref} style={{ height }} className="w-full" role="img" />;
}
