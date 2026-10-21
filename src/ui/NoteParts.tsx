/** 笔记页的内容件：书头、书评、划线条目、过滤条、目录 */

import {
  BookOpen,
  CircleHelp,
  Copy,
  Layers,
  MessageSquareQuote,
  PenLine,
  RefreshCw,
} from "lucide-react";
import { Button, FilterPill, IconButton, Tooltip, cn, toast } from "@tau/ui";
import {
  HIGHLIGHT_COLORS,
  formatMinutes,
  formatReadDay,
  type BookNote,
  type HighlightColor,
  type NoteChapter,
  type NoteFilter,
  type WeReadBook,
} from "../model";
import { BookCover, ProgressBar } from "./bits";
import { HIGHLIGHT_DOT, SERIF, markClass } from "./styles";

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success("已复制");
}

export function BookHeader({
  book,
  counts,
  connected,
  refreshing,
  onOpenWeb,
  onRefresh,
  onCopyMarkdown,
}: {
  book: WeReadBook;
  counts: { highlights: number; reviews: number };
  connected: boolean;
  refreshing: boolean;
  onOpenWeb?: () => void;
  onRefresh(): void;
  onCopyMarkdown?: () => void;
}) {
  return (
    <header className="wr:flex wr:items-start wr:gap-5">
      <BookCover book={book} className="wr:w-[88px]" titleClassName="wr:text-[12px]" />
      <div className="wr:min-w-0 wr:flex-1">
        <h1
          className={cn(
            SERIF,
            "wr:text-[24px] wr:font-semibold wr:leading-[1.3] wr:tracking-[0.02em]"
          )}
        >
          {book.title}
        </h1>
        <p className="wr:text-tau-body wr:text-ink-2 wr:mt-0.5">
          {[book.author, book.publisher].filter(Boolean).join(" · ")}
        </p>
        <div className="wr:text-tau-micro wr:text-ink-3 wr:mt-2.5 wr:flex wr:max-w-[320px] wr:items-center wr:gap-2 wr:tabular-nums">
          <ProgressBar book={book} className="wr:flex-1" />
          {book.status === "finished" ? "读完" : `${book.progress}%`}
        </div>
        <p className="wr:text-tau-sm wr:text-ink-3 wr:mt-2 wr:flex wr:flex-wrap wr:gap-x-3.5 wr:gap-y-1 wr:tabular-nums">
          {book.minutes > 0 && (
            <span>
              阅读 <b className="wr:text-ink-1 wr:font-medium">{formatMinutes(book.minutes)}</b>
            </span>
          )}
          <span>
            划线 <b className="wr:text-ink-1 wr:font-medium">{counts.highlights}</b>
          </span>
          <span>
            想法 <b className="wr:text-ink-1 wr:font-medium">{counts.reviews}</b>
          </span>
          {book.lastRead && (
            <span>
              最近阅读{" "}
              <b className="wr:text-ink-1 wr:font-medium">{formatReadDay(book.lastRead)}</b>
            </span>
          )}
        </p>
        <div className="wr:-ml-2 wr:mt-3 wr:flex wr:flex-wrap wr:gap-1">
          {onOpenWeb && (
            <Button variant="ghost" size="sm" icon={BookOpen} onClick={onOpenWeb}>
              在微信读书中打开
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            loadingText="拉取中…"
            disabled={!connected}
            title={connected ? undefined : "连接微信读书后才能拉取"}
            onClick={onRefresh}
          >
            重新拉取笔记
          </Button>
          {onCopyMarkdown && (
            <Button variant="ghost" size="sm" icon={Copy} onClick={onCopyMarkdown}>
              复制为 Markdown
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function BookReviews({ reviews }: { reviews: { id: string; paragraphs: string[] }[] }) {
  if (!reviews.length) return null;
  return (
    <div className="wr:bg-accent-soft wr:mt-5 wr:flex wr:flex-col wr:gap-3 wr:rounded-[var(--tau-radius-md)] wr:px-4 wr:py-3.5">
      {reviews.map(review => (
        <div key={review.id}>
          <p className="wr:text-tau-sm wr:text-accent-text wr:mb-1 wr:flex wr:items-center wr:gap-1.5 wr:font-medium">
            <PenLine className="wr:size-3.5" strokeWidth={1.75} />
            我的书评
          </p>
          {review.paragraphs.map((p, i) => (
            <p key={i} className="wr:text-tau-body-lg wr:leading-[1.85]">
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function NoteFilterBar({
  filter,
  colors,
  onChange,
}: {
  filter: NoteFilter;
  /** 本书出现过的划线颜色 */
  colors: HighlightColor[];
  onChange(filter: NoteFilter): void;
}) {
  return (
    <div className="wr:bg-surface wr:sticky wr:top-0 wr:z-[2] wr:-mx-1 wr:mt-5 wr:flex wr:items-center wr:gap-1.5 wr:px-1 wr:py-2.5">
      <FilterPill active={filter === "all"} onClick={() => onChange("all")} label="全部" />
      <FilterPill
        active={filter === "review"}
        onClick={() => onChange(filter === "review" ? "all" : "review")}
        label="有想法"
      />
      {colors.length > 1 && <span className="wr:w-1.5" />}
      {colors.length > 1 &&
        HIGHLIGHT_COLORS.filter(c => colors.includes(c.value)).map(c => (
          <Tooltip key={c.value} content={`${c.label}色划线`}>
            <button
              type="button"
              aria-pressed={filter === c.value}
              aria-label={`${c.label}色划线`}
              onClick={() => onChange(filter === c.value ? "all" : c.value)}
              className={cn(
                "wr:hover:bg-hover wr:grid wr:size-6 wr:place-items-center wr:rounded-full wr:outline-none wr:focus-visible:shadow-[var(--tau-focus-ring)]",
                filter === c.value && "wr:shadow-[inset_0_0_0_1.5px_var(--tau-ink-3)]"
              )}
            >
              <span className={cn("wr:size-2.5 wr:rounded-full", HIGHLIGHT_DOT[c.value])} />
            </button>
          </Tooltip>
        ))}
    </div>
  );
}

/** 想法：浅 accent 底的批注块，是笔记页的视觉重点（纯划线只有原文） */
function Thought({ paragraphs, className }: { paragraphs: string[]; className?: string }) {
  return (
    <div
      className={cn(
        "wr:bg-accent-soft wr:text-tau-body wr:text-ink-1 wr:flex wr:gap-2 wr:rounded-[var(--tau-radius-md)] wr:px-3 wr:py-2 wr:leading-[1.75]",
        className
      )}
    >
      <MessageSquareQuote
        className="wr:text-accent-text wr:mt-1 wr:size-3.5 wr:shrink-0"
        strokeWidth={1.75}
      />
      <div>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

function NoteItem({
  note,
  onToCard,
  onToQuestion,
}: {
  note: BookNote;
  onToCard?: (note: BookNote) => void;
  onToQuestion?: (note: BookNote) => void;
}) {
  const text = [...note.paragraphs, ...(note.review.length ? ["", ...note.review] : [])].join("\n");
  return (
    <div
      data-note-id={note.id}
      className="wr:bg-hover wr:hover:bg-press wr:group wr:relative wr:rounded-[var(--tau-radius-md)] wr:px-4 wr:py-3 wr:transition-colors wr:duration-150"
    >
      {note.paragraphs.length > 0 && (
        <div className={cn(SERIF, "wr:text-ink-1 wr:text-[15.5px] wr:leading-[1.95]")}>
          {note.paragraphs.map((p, i) => (
            <p key={i}>
              <mark
                className={cn(
                  "wr:bg-transparent wr:text-inherit",
                  markClass(note.style, note.color)
                )}
              >
                {p}
              </mark>
            </p>
          ))}
        </div>
      )}
      {note.review.length > 0 && <Thought paragraphs={note.review} className="wr:mt-2.5" />}
      {/* 固定槽位淡入，不顶开布局 */}
      <div className="wr:absolute wr:right-1.5 wr:top-1.5 wr:flex wr:gap-1 wr:opacity-0 wr:transition-opacity wr:duration-150 wr:focus-within:opacity-100 wr:group-hover:opacity-100">
        {onToCard && note.paragraphs.length > 0 && (
          <IconButton
            title="转为卡片"
            onClick={() => onToCard(note)}
            className="wr:bg-surface wr:enabled:hover:bg-surface-hover wr:shadow-lift wr:size-[26px] wr:rounded-[8px]"
          >
            <Layers className="wr:size-[13px]" strokeWidth={1.75} />
          </IconButton>
        )}
        {onToQuestion && note.paragraphs.length > 0 && (
          <IconButton
            title="转为问题"
            onClick={() => onToQuestion(note)}
            className="wr:bg-surface wr:enabled:hover:bg-surface-hover wr:shadow-lift wr:size-[26px] wr:rounded-[8px]"
          >
            <CircleHelp className="wr:size-[13px]" strokeWidth={1.75} />
          </IconButton>
        )}
        <IconButton
          title="复制"
          onClick={() => void copy(text)}
          className="wr:bg-surface wr:enabled:hover:bg-surface-hover wr:shadow-lift wr:size-[26px] wr:rounded-[8px]"
        >
          <Copy className="wr:size-[13px]" strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  );
}

export function ChapterSection({
  chapter,
  index,
  onToCard,
  onToQuestion,
}: {
  chapter: NoteChapter;
  index: number;
  onToCard?: (note: BookNote) => void;
  onToQuestion?: (note: BookNote) => void;
}) {
  const count = chapter.notes.length + chapter.thoughts.length;
  return (
    <section data-chapter={chapter.key} className="wr:mt-9 wr:scroll-mt-14">
      <h2 className="wr:mb-3 wr:flex wr:items-baseline wr:gap-2 wr:text-[15px] wr:font-semibold">
        <span className="wr:font-tau-mono wr:text-ink-3 wr:text-[12px] wr:font-medium wr:tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        {chapter.title}
        <span className="wr:text-tau-sm wr:text-ink-3 wr:font-normal wr:tabular-nums">{count}</span>
      </h2>
      {/* 条目之间靠留白分组（不画分隔线） */}
      <div className="wr:flex wr:flex-col wr:gap-2.5">
        {chapter.notes.map(note => (
          <NoteItem key={note.id} note={note} onToCard={onToCard} onToQuestion={onToQuestion} />
        ))}
      </div>
      {chapter.thoughts.map((t, i) => (
        <Thought key={i} paragraphs={t} className="wr:mt-2.5" />
      ))}
    </section>
  );
}

export function NoteToc({
  chapters,
  active,
  onJump,
}: {
  chapters: NoteChapter[];
  active: string | null;
  onJump(key: string): void;
}) {
  return (
    <nav aria-label="目录" className="wr:flex wr:flex-col wr:gap-px">
      <p className="wr:text-tau-sm wr:text-ink-3 wr:flex wr:justify-between wr:px-2.5 wr:pb-1.5">
        <span>目录</span>
        <span className="wr:tabular-nums">{chapters.length} 章</span>
      </p>
      {chapters.map(ch => (
        <button
          key={ch.key}
          type="button"
          onClick={() => onJump(ch.key)}
          className={cn(
            "wr:text-tau-meta wr:hover:bg-hover wr:flex wr:h-[30px] wr:shrink-0 wr:items-center wr:gap-2 wr:rounded-[var(--tau-radius-sm)] wr:px-2.5 wr:text-left wr:outline-none wr:focus-visible:shadow-[var(--tau-focus-ring)]",
            active === ch.key ? "wr:bg-hover wr:text-ink-1 wr:font-medium" : "wr:text-ink-2"
          )}
        >
          <span className="wr:min-w-0 wr:flex-1 wr:truncate">{ch.title}</span>
          <span className="wr:text-tau-tiny wr:text-ink-3 wr:tabular-nums">
            {ch.notes.length + ch.thoughts.length}
          </span>
        </button>
      ))}
    </nav>
  );
}
