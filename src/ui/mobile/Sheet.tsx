/**
 * 手机底部面板：贴底圆角卡 + 遮罩，系统返回与点遮罩关闭。
 * 返回经 pageContext.registerDismiss 交给 Tau 仲裁（后开的面板先关）。
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import type { Disposable } from "@tau/plugins";
import { cn, lockBodyScroll, usePortalContainer } from "@tau/ui";

/** 页面把 pageContext.registerDismiss 放进来，面板据此登记返回 */
export const SheetHost = createContext<((dismiss: () => void) => Disposable) | null>(null);

const DURATION = 240;

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose(): void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const container = usePortalContainer();
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), DURATION);
    return () => window.clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll(container.ownerDocument);
  }, [open, container]);
  const registerDismiss = useContext(SheetHost);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !registerDismiss) return;
    const handle = registerDismiss(() => close.current());
    return () => void handle.dispose();
  }, [open, registerDismiss]);
  if (!mounted) return null;
  return createPortal(
    <div className="wr:fixed wr:inset-0 wr:z-[60]" data-no-edge-back>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "wr:bg-overlay wr:absolute wr:inset-0 wr:transition-opacity wr:duration-200",
          shown ? "wr:opacity-100" : "wr:opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={cn(
          "wr:bg-surface wr:shadow-float wr:absolute wr:inset-x-0 wr:bottom-0 wr:flex wr:max-h-[80%] wr:flex-col wr:rounded-t-[24px] wr:pt-2",
          "wr:pb-[max(12px,env(safe-area-inset-bottom))] wr:ease-tau-out wr:transition-transform wr:duration-[240ms]",
          shown ? "wr:translate-y-0" : "wr:translate-y-full"
        )}
      >
        <div
          aria-hidden
          className="wr:bg-line-1 wr:mx-auto wr:mb-2 wr:h-1 wr:w-9 wr:shrink-0 wr:rounded-full"
        />
        {title && (
          <div className="wr:flex wr:shrink-0 wr:items-baseline wr:gap-2 wr:px-[18px] wr:pb-2">
            <h2 className="wr:text-[16px] wr:font-[650]">{title}</h2>
            {subtitle && <span className="wr:text-ink-3 wr:text-[12px]">{subtitle}</span>}
          </div>
        )}
        <div className="wr:min-h-0 wr:overflow-y-auto wr:overscroll-contain">{children}</div>
      </div>
    </div>,
    container
  );
}

/** 面板里的一行：图标 + 文字（可带一行说明），可带右侧勾选；相邻行之间一条细线 */
export function SheetRow({
  icon,
  label,
  hint,
  checked,
  disabled,
  onClick,
}: {
  icon?: ReactNode;
  label: ReactNode;
  /** 标题下一行小字（如请求数、耗时提醒） */
  hint?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? undefined : "menuitemradio"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "wr:active:bg-press wr:not-first:shadow-[inset_0_1px_0_var(--tau-line-2)] wr:flex wr:min-h-[48px] wr:w-full wr:items-center wr:gap-3 wr:px-[18px] wr:py-2 wr:text-left wr:text-[15px] wr:disabled:opacity-40",
        checked && "wr:text-accent-text wr:font-semibold"
      )}
    >
      {icon && <span className="wr:text-ink-2 wr:flex wr:shrink-0">{icon}</span>}
      <span className="wr:flex wr:min-w-0 wr:flex-1 wr:flex-col wr:gap-0.5">
        <span className="wr:truncate">{label}</span>
        {hint && <span className="wr:text-ink-3 wr:text-[12px] wr:leading-[1.5]">{hint}</span>}
      </span>
      {checked && (
        <Check className="wr:text-accent-text wr:size-[18px] wr:shrink-0" strokeWidth={2} />
      )}
    </button>
  );
}

export const SheetGroup = ({ children }: { children: ReactNode }) => (
  <p className="wr:text-ink-3 wr:px-[18px] wr:pb-1 wr:pt-2 wr:text-[12px]">{children}</p>
);
