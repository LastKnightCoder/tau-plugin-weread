/** 微信读书域的样式映射（纯类名，供组件共用） */

import { cn } from "@tau/ui";
import type { HighlightColor, HighlightStyle } from "../model";

/** 书名 / 划线原文的衬线字体（阅读感；系统没有时回落无衬线） */
export const SERIF = "wr:font-['Songti_SC','STSong','Noto_Serif_SC','Source_Han_Serif_SC',serif]";

/* 微信读书颜色 → 主题数据色（红 tag-5 / 紫 tag-3 / 蓝 tag-2 / 绿 tag-1 / 黄 tag-4） */
export const HIGHLIGHT_DOT: Record<HighlightColor, string> = {
  1: "wr:bg-tag-5",
  2: "wr:bg-tag-3",
  3: "wr:bg-tag-2",
  4: "wr:bg-tag-1",
  5: "wr:bg-tag-4",
};
const MARKER_BG: Record<HighlightColor, string> = {
  1: "wr:bg-tag-5/30",
  2: "wr:bg-tag-3/30",
  3: "wr:bg-tag-2/30",
  4: "wr:bg-tag-1/30",
  5: "wr:bg-tag-4/35",
};
const LINE_COLOR: Record<HighlightColor, string> = {
  1: "wr:decoration-tag-5",
  2: "wr:decoration-tag-3",
  3: "wr:decoration-tag-2",
  4: "wr:decoration-tag-1",
  5: "wr:decoration-tag-4",
};

/** 还原微信读书的划线样式：0 下划线 / 1 马克笔 / 2 波浪线 */
export function markClass(style: HighlightStyle, color: HighlightColor): string {
  const base = "wr:[box-decoration-break:clone] wr:px-px";
  if (style === 1) return cn(base, "wr:rounded-[3px]", MARKER_BG[color]);
  return cn(
    base,
    "wr:underline wr:underline-offset-[5px]",
    style === 2 ? "wr:decoration-wavy wr:decoration-[1.5px]" : "wr:decoration-[2px]",
    LINE_COLOR[color]
  );
}
