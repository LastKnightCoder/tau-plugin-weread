/** 微信读书域的小件：封面、进度条、状态点 */

import { useState, type ReactNode } from "react";
import { cn } from "@tau/ui";
import { STATUS_LABEL, coverTone, type ReadingStatus, type WeReadBook } from "../model";
import { SERIF } from "./styles";

const TONE_BG = {
  1: "wr:bg-tag-1-soft wr:text-tag-1",
  2: "wr:bg-tag-2-soft wr:text-tag-2",
  3: "wr:bg-tag-3-soft wr:text-tag-3",
  4: "wr:bg-tag-4-soft wr:text-tag-4",
  5: "wr:bg-tag-5-soft wr:text-tag-5",
} as const;

/**
 * 封面：微信读书封面图；无图或加载失败时按书 id 派生粉彩底 + 书名。
 * 宽度由调用方给（className），高宽比固定 3:4.3。
 */
export function BookCover({
  book,
  className,
  titleClassName,
  bare = false,
  children,
}: {
  book: Pick<WeReadBook, "id" | "title" | "author" | "cover">;
  className?: string;
  /** 兜底封面上书名的字号 */
  titleClassName?: string;
  /** 缩略尺寸：兜底封面不写书名 */
  bare?: boolean;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.cover) && !failed;
  return (
    <div
      className={cn(
        "wr:shadow-lift wr:relative wr:aspect-[3/4.3] wr:shrink-0 wr:overflow-hidden wr:rounded-[3px_6px_6px_3px]",
        !showImage && TONE_BG[coverTone(book.id)],
        className
      )}
    >
      {showImage ? (
        <img
          src={book.cover}
          alt=""
          loading="lazy"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="wr:size-full wr:object-cover"
        />
      ) : bare ? null : (
        <div className="wr:flex wr:size-full wr:flex-col wr:px-[12%] wr:pb-[10%] wr:pt-[14%]">
          <span
            className={cn(
              SERIF,
              "wr:line-clamp-4 wr:font-semibold wr:leading-[1.35]",
              titleClassName
            )}
          >
            {book.title}
          </span>
          <span className="wr:mt-auto wr:line-clamp-1 wr:text-[0.7em] wr:opacity-80">
            {book.author}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

export function ProgressBar({ book, className }: { book: WeReadBook; className?: string }) {
  return (
    <div className={cn("wr:bg-line-1 wr:h-[3px] wr:overflow-hidden wr:rounded-full", className)}>
      <div
        className={cn(
          "wr:h-full wr:rounded-full",
          book.status === "finished" ? "wr:bg-ok" : "wr:bg-accent"
        )}
        style={{ width: `${book.progress}%` }}
      />
    </div>
  );
}

const STATUS_DOT: Record<ReadingStatus, string> = {
  reading: "wr:bg-accent",
  finished: "wr:bg-ok",
  unread: "wr:bg-ink-3",
};

export function StatusDot({ status }: { status: ReadingStatus }) {
  return (
    <span className="wr:text-tau-sm wr:text-ink-2 wr:inline-flex wr:items-center wr:gap-1.5 wr:whitespace-nowrap">
      <span className={cn("wr:size-1.5 wr:rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
