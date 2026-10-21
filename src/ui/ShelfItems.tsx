/** 书架条目：「在读」续读卡、封面格、列表排布（行式，点列头排序） */

import { ArrowDown } from "lucide-react";
import { cn } from "@tau/ui";
import { formatMinutes, formatReadDay, type ShelfSort, type WeReadBook } from "../model";
import { BookCover, ProgressBar, StatusDot } from "./bits";

export function ReadingCard({ book, onOpen }: { book: WeReadBook; onOpen(): void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="wr:hover:bg-hover wr:ease-tau-out wr:flex wr:min-w-0 wr:gap-3.5 wr:rounded-[var(--tau-radius-lg)] wr:p-3.5 wr:text-left wr:outline-none wr:transition-colors wr:duration-150 wr:focus-visible:shadow-[var(--tau-focus-ring)]"
    >
      <BookCover book={book} className="wr:w-[64px] wr:self-start" titleClassName="wr:text-[9px]" />
      <span className="wr:flex wr:min-w-0 wr:flex-1 wr:flex-col wr:gap-0.5 wr:py-0.5">
        <span className="wr:truncate wr:text-[14px] wr:font-semibold">{book.title}</span>
        <span className="wr:text-tau-sm wr:text-ink-3 wr:truncate">{book.author}</span>
        <span className="wr:text-tau-sm wr:text-ink-2 wr:mt-1 wr:truncate wr:tabular-nums">
          最近阅读 {formatReadDay(book.lastRead)}
          {book.minutes > 0 && (
            <span className="wr:text-ink-3"> · 累计 {formatMinutes(book.minutes)}</span>
          )}
        </span>
        <span className="wr:text-tau-micro wr:text-ink-3 wr:mt-auto wr:flex wr:items-center wr:gap-2 wr:tabular-nums">
          <ProgressBar book={book} className="wr:flex-1" />
          {book.progress}%
        </span>
      </span>
    </button>
  );
}

export function CoverTile({ book, onOpen }: { book: WeReadBook; onOpen(): void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="wr:group wr:min-w-0 wr:text-left wr:outline-none"
    >
      <BookCover
        book={book}
        titleClassName="wr:text-[13px]"
        className="wr:ease-tau-out wr:w-full wr:transition-shadow wr:duration-200 wr:group-hover:shadow-[var(--tau-shadow-float)] wr:group-focus-visible:shadow-[var(--tau-focus-ring)]"
      >
        {book.status === "reading" && (
          <span className="wr:bg-ink-1/20 wr:absolute wr:inset-x-0 wr:bottom-0 wr:h-[3px]">
            <span
              className="wr:bg-accent wr:block wr:h-full"
              style={{ width: `${book.progress}%` }}
            />
          </span>
        )}
      </BookCover>
      <span className="wr:mt-2.5 wr:line-clamp-2 wr:text-[13px] wr:font-medium wr:leading-[1.4]">
        {book.title}
      </span>
      <span className="wr:text-tau-micro wr:text-ink-3 wr:mt-0.5 wr:flex wr:gap-2 wr:tabular-nums">
        {book.status === "finished" ? (
          <span className="wr:text-ok">读完</span>
        ) : book.status === "reading" ? (
          <span>{book.progress}%</span>
        ) : null}
        {book.notes > 0 ? (
          <span>{book.notes} 划线</span>
        ) : (
          <span className="wr:truncate">{book.author}</span>
        )}
      </span>
    </button>
  );
}

const LIST_COLS =
  "wr:grid wr:grid-cols-[minmax(220px,2.4fr)_minmax(80px,1fr)_72px_minmax(120px,1.2fr)_96px_minmax(96px,1fr)_76px] wr:items-center wr:gap-4";

const SORTABLE: { key: ShelfSort; label: string }[] = [
  { key: "progress", label: "进度" },
  { key: "minutes", label: "阅读时长" },
  { key: "notes", label: "笔记" },
  { key: "last", label: "最近阅读" },
];

export function ShelfList({
  books,
  sort,
  onSort,
  onOpen,
}: {
  books: WeReadBook[];
  sort: ShelfSort;
  onSort(sort: ShelfSort): void;
  onOpen(book: WeReadBook): void;
}) {
  const head = (key: ShelfSort, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => onSort(key)}
      className={cn(
        "wr:hover:text-ink-1 wr:inline-flex wr:items-center wr:gap-0.5 wr:text-left",
        sort === key && "wr:text-ink-1 wr:font-medium"
      )}
    >
      {label}
      {sort === key && <ArrowDown className="wr:size-3" strokeWidth={2} />}
    </button>
  );
  return (
    <div className="wr:-mx-3">
      <div className={cn(LIST_COLS, "wr:text-tau-sm wr:text-ink-3 wr:px-3 wr:py-2")}>
        <span>书名 / 作者</span>
        <span>分类</span>
        <span>状态</span>
        {SORTABLE.map(({ key, label }) => head(key, label))}
      </div>
      {books.map(book => (
        <button
          key={book.id}
          type="button"
          onClick={() => onOpen(book)}
          className={cn(
            LIST_COLS,
            "wr:hover:bg-hover wr:w-full wr:rounded-[var(--tau-radius-md)] wr:px-3 wr:py-2 wr:text-left wr:outline-none wr:focus-visible:shadow-[var(--tau-focus-ring)]"
          )}
        >
          <span className="wr:flex wr:min-w-0 wr:items-center wr:gap-3">
            <BookCover
              bare
              book={book}
              className="wr:shadow-card wr:w-[30px] wr:rounded-[2px_3px_3px_2px]"
            />
            <span className="wr:min-w-0">
              <span className="wr:block wr:truncate wr:font-medium">{book.title}</span>
              <span className="wr:text-tau-sm wr:text-ink-3 wr:block wr:truncate">
                {book.author}
              </span>
            </span>
          </span>
          <span className="wr:text-tau-sm wr:text-ink-2 wr:truncate">{book.archive || "—"}</span>
          <StatusDot status={book.status} />
          <span className="wr:text-tau-sm wr:text-ink-3 wr:flex wr:items-center wr:gap-2 wr:tabular-nums">
            <ProgressBar book={book} className="wr:flex-1" />
            <span className="wr:w-8 wr:text-right">{book.progress}%</span>
          </span>
          <span className="wr:text-tau-sm wr:text-ink-2 wr:tabular-nums">
            {book.minutes ? formatMinutes(book.minutes) : "—"}
          </span>
          <span className="wr:text-tau-sm wr:text-ink-2 wr:truncate wr:tabular-nums">
            {book.notes + book.reviews > 0
              ? `${book.notes} 划线${book.reviews ? ` · ${book.reviews} 想法` : ""}`
              : "—"}
          </span>
          <span className="wr:text-tau-sm wr:text-ink-2 wr:tabular-nums">
            {formatReadDay(book.lastRead)}
          </span>
        </button>
      ))}
    </div>
  );
}
