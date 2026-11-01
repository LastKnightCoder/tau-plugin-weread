/** 手机页面的小件：触控尺寸的胶囊、图标按钮、分区标题 */

import type { ReactNode } from "react";
import { cn } from "@tau/ui";

/**
 * 胶囊：外观同 FilterPill，高 30px 便于触控。不靠 className 覆盖 FilterPill 的 h-6：
 * 带 wr: 前缀的类与宿主类不在同一 tailwind-merge 分组，谁生效取决于样式表顺序。
 */
export function Pill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick(): void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "wr:flex wr:h-[30px] wr:shrink-0 wr:items-center wr:gap-1.5 wr:whitespace-nowrap wr:rounded-full wr:px-3 wr:text-[13px]",
        active ? "wr:bg-selected wr:text-accent-text wr:font-semibold" : "wr:bg-surface wr:shadow-card wr:text-ink-2"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("wr:text-[11px] wr:tabular-nums", active ? "wr:opacity-75" : "wr:text-ink-3")}>
          {count}
        </span>
      )}
    </button>
  );
}

export function Section({ title, hint }: { title: string; hint?: string }) {
  return (
    <h2 className="wr:flex wr:items-baseline wr:gap-2 wr:px-4 wr:pb-2.5 wr:pt-4 wr:text-[14px] wr:font-semibold">
      {title}
      {hint && <small className="wr:text-ink-3 wr:text-[11.5px] wr:font-normal wr:tabular-nums">{hint}</small>}
    </h2>
  );
}

/** 36px 图标按钮；on 时强调色底，dot 时右上角一个点（筛选不是默认值） */
export function TouchIcon({
  label,
  on,
  dot,
  disabled,
  onClick,
  children,
}: {
  label: string;
  on?: boolean;
  dot?: boolean;
  disabled?: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "wr:active:bg-press wr:relative wr:grid wr:size-9 wr:shrink-0 wr:place-items-center wr:rounded-[12px] wr:disabled:opacity-40",
        on ? "wr:bg-accent-soft wr:text-accent-text" : "wr:text-ink-2"
      )}
    >
      {children}
      {dot && <span className="wr:bg-accent wr:absolute wr:right-[7px] wr:top-[7px] wr:size-[7px] wr:rounded-full" />}
    </button>
  );
}
