/**
 * 手机单书笔记：书头 → 两个按钮 + ⋯ → 书评 → 吸顶过滤条（全部 / 有想法 / 颜色 + 目录）→ 按章节排的划线。
 * 点一条划线弹出操作面板；长按交给系统选字。目录收进底部面板，按钮上显示当前章节。
 */

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Copy,
  Ellipsis,
  Highlighter,
  Layers,
  ListTree,
  MessageSquareQuote,
  RefreshCw,
  SquareArrowOutUpRight,
} from "lucide-react";
import { useI18n, type PluginPageContext } from "@tau/plugins";
import { Button, Loading, cn, toast } from "@tau/ui";
import { messages } from "../../i18n";
import { HIGHLIGHT_COLORS, type BookNote, type NoteChapter } from "../../model";
import { openExternal } from "../../hooks";
import { BookInfo, BookReviews, ChapterSection, noteText } from "../NoteParts";
import { HIGHLIGHT_DOT, SERIF } from "../styles";
import { useBookPage } from "../useBookPage";
import { Pill } from "./parts";
import { Sheet, SheetHost, SheetRow } from "./Sheet";
import type { Translate } from "../../model";

const ICON = { size: 19, strokeWidth: 1.75 } as const;

async function copy(text: string, t: Translate) {
  await navigator.clipboard.writeText(text);
  toast.success(t("notes.copied"));
}

export function MobileBook({
  bookId,
  bookmark,
  bookmarkRequest,
  pageContext,
}: {
  bookId: string;
  bookmark?: string;
  bookmarkRequest?: string;
  pageContext: PluginPageContext;
}) {
  const { t } = useI18n(messages);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const page = useBookPage({
    bookId,
    bookmark,
    bookmarkRequest,
    container: root,
    anchorTop: () => (barRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
  });
  const { book, notes, chapters, colors, filter, setFilter, connected, refreshing } = page;
  const [pressed, setPressed] = useState<BookNote | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  if (page.loading) return <Loading />;

  if (!page.detail || !book || !notes) {
    return (
      <div className="wr:flex wr:min-h-full wr:flex-col wr:items-center wr:justify-center wr:gap-2 wr:px-8 wr:text-center">
        <p className="wr:text-ink-1 wr:text-[15px] wr:font-semibold">{t("notes.notFound")}</p>
        <p className="wr:text-tau-meta wr:text-ink-2">{t("notes.notFoundHint")}</p>
        <Button
          variant="secondary"
          size="sm"
          className="wr:mt-2"
          onClick={() => void page.pages.shelf.open()}
        >
          {t("notes.backToShelf")}
        </Button>
      </div>
    );
  }

  const webUrl = book.webUrl;
  const openWeb = webUrl ? () => openExternal(webUrl) : undefined;
  const activeTitle = chapters.find(ch => ch.key === page.activeKey)?.title;

  return (
    <SheetHost.Provider value={pageContext.registerDismiss}>
      <div ref={setRoot} className="wr:mx-auto wr:w-full wr:max-w-[720px] wr:pb-8">
        <div className="wr:px-[18px] wr:pt-1.5">
          <BookInfo book={book} counts={page.counts} compact />
          <div className="wr:mt-3 wr:flex wr:gap-2">
            {openWeb && (
              <Button
                variant="secondary"
                size="sm"
                icon={BookOpen}
                className="wr:flex-1"
                onClick={openWeb}
              >
                {t("notes.openInWeRead")}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              className={openWeb ? undefined : "wr:flex-1"}
              loading={refreshing}
              loadingText={t("notes.fetching")}
              disabled={!connected}
              onClick={page.refresh}
            >
              {t("notes.refreshShort")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label={t("common.more")}
              onClick={() => setMoreOpen(true)}
            >
              <Ellipsis className="wr:size-[17px]" strokeWidth={1.75} />
            </Button>
          </div>
          {page.status && <p className="wr:text-tau-sm wr:text-warn wr:mt-2.5">{page.status}</p>}
          <BookReviews reviews={notes.bookReviews} />
        </div>

        {page.empty ? (
          <div className="wr:flex wr:flex-col wr:items-center wr:gap-2 wr:px-8 wr:py-16 wr:text-center">
            <Highlighter className="wr:text-ink-3 wr:size-7" strokeWidth={1.5} />
            <p className="wr:text-ink-1 wr:text-[15px] wr:font-semibold">
              {refreshing ? t("notes.empty.fetching") : t("notes.empty.title")}
            </p>
            {!refreshing && (
              <p className="wr:text-tau-meta wr:text-ink-2">{t("notes.empty.hintMobile")}</p>
            )}
          </div>
        ) : (
          <>
            <div
              ref={barRef}
              className="wr:bg-page wr:sticky wr:top-0 wr:z-[2] wr:mt-3 wr:flex wr:items-center wr:gap-1.5 wr:py-2 wr:pl-[18px] wr:pr-2.5"
            >
              <Pill active={filter === "all"} onClick={() => setFilter("all")} label={t("filter.all")} />
              <Pill
                active={filter === "review"}
                onClick={() => setFilter(filter === "review" ? "all" : "review")}
                label={t("notes.filter.review")}
              />
              {colors.length > 1 &&
                HIGHLIGHT_COLORS.filter(c => colors.includes(c.value)).map(c => (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={filter === c.value}
                    aria-label={t("notes.colorHighlight", { color: t(c.key) })}
                    onClick={() => setFilter(filter === c.value ? "all" : c.value)}
                    className={cn(
                      "wr:grid wr:size-[26px] wr:shrink-0 wr:place-items-center wr:rounded-full",
                      filter === c.value && "wr:shadow-[inset_0_0_0_1.5px_var(--tau-ink-3)]"
                    )}
                  >
                    <span className={cn("wr:size-2.5 wr:rounded-full", HIGHLIGHT_DOT[c.value])} />
                  </button>
                ))}
              {notes.chapters.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTocOpen(true)}
                  className="wr:text-ink-2 wr:active:bg-press wr:ml-auto wr:flex wr:h-[30px] wr:min-w-0 wr:max-w-[128px] wr:items-center wr:gap-1 wr:rounded-[10px] wr:px-2 wr:text-[12.5px]"
                >
                  <ListTree className="wr:size-4 wr:shrink-0" strokeWidth={1.75} />
                  <span className="wr:truncate">{activeTitle ?? t("notes.toc")}</span>
                </button>
              )}
            </div>
            <div className="wr:px-3.5">
              {chapters.map(chapter => (
                <ChapterSection
                  key={chapter.key}
                  chapter={chapter}
                  index={notes.chapters.findIndex(c => c.key === chapter.key)}
                  onPress={setPressed}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <NoteSheet
        note={pressed}
        source={pressed ? `${book.title} · ${chapterOf(chapters, pressed)}` : ""}
        onClose={() => setPressed(null)}
        onToCard={page.toCard}
      />
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        {page.copyMarkdown && (
          <SheetRow
            icon={<Copy {...ICON} />}
            label={t("notes.copyAllMarkdown")}
            onClick={() => {
              setMoreOpen(false);
              page.copyMarkdown?.();
            }}
          />
        )}
        <SheetRow
          icon={<RefreshCw {...ICON} />}
          label={t("notes.refresh")}
          disabled={!connected || refreshing}
          onClick={() => {
            setMoreOpen(false);
            page.refresh();
          }}
        />
        {openWeb && (
          <SheetRow
            icon={<SquareArrowOutUpRight {...ICON} />}
            label={t("notes.openInWeRead")}
            onClick={() => {
              setMoreOpen(false);
              openWeb();
            }}
          />
        )}
      </Sheet>
      <TocSheet
        open={tocOpen}
        chapters={notes.chapters}
        active={page.activeKey}
        onClose={() => setTocOpen(false)}
        onJump={key => {
          setTocOpen(false);
          if (filter !== "all") setFilter("all");
          // 等面板收起、过滤恢复后的那一帧再滚
          requestAnimationFrame(() => page.jump(key));
        }}
      />
    </SheetHost.Provider>
  );
}

const chapterOf = (chapters: NoteChapter[], note: BookNote) =>
  chapters.find(ch => ch.notes.some(n => n.id === note.id))?.title ?? "";

/** 一条划线的操作：原文预览 + 转为卡片 / 复制 */
function NoteSheet({
  note,
  source,
  onClose,
  onToCard,
}: {
  note: BookNote | null;
  source: string;
  onClose(): void;
  onToCard(note: BookNote): void;
}) {
  const { t } = useI18n(messages);
  // 退场动画期间保留内容
  const last = useRef(note);
  if (note) last.current = note;
  const shown = note ?? last.current;
  const run = (action: () => void) => {
    onClose();
    action();
  };
  return (
    <Sheet open={Boolean(note)} onClose={onClose}>
      {shown && (
        <>
          <div className="wr:border-line-1 wr:mx-[18px] wr:mb-2.5 wr:rounded-[14px] wr:border wr:px-3 wr:py-2.5">
            <p
              className={cn(SERIF, "wr:text-ink-1 wr:line-clamp-4 wr:text-[14px] wr:leading-[1.8]")}
            >
              {(shown.paragraphs.length ? shown.paragraphs : shown.review).join(" ")}
            </p>
            {source && (
              <p className="wr:text-ink-3 wr:mt-1 wr:truncate wr:text-[11.5px]">{source}</p>
            )}
          </div>
          {shown.paragraphs.length > 0 && (
            <SheetRow
              icon={<Layers {...ICON} />}
              label={t("notes.toCard")}
              onClick={() => run(() => onToCard(shown))}
            />
          )}
          <SheetRow
            icon={<Copy {...ICON} />}
            label={shown.paragraphs.length ? t("notes.copyHighlight") : t("notes.copyReview")}
            onClick={() =>
              run(
                () =>
                  void copy(
                    shown.paragraphs.length ? noteText(shown, false) : shown.review.join("\n"),
                    t
                  )
              )
            }
          />
          {shown.paragraphs.length > 0 && shown.review.length > 0 && (
            <SheetRow
              icon={<MessageSquareQuote {...ICON} />}
              label={t("notes.copyBoth")}
              onClick={() => run(() => void copy(noteText(shown), t))}
            />
          )}
        </>
      )}
    </Sheet>
  );
}

/** 目录：只列有笔记的章节，当前章节加底色；打开时滚到当前章节 */
function TocSheet({
  open,
  chapters,
  active,
  onClose,
  onJump,
}: {
  open: boolean;
  chapters: NoteChapter[];
  active: string | null;
  onClose(): void;
  onJump(key: string): void;
}) {
  const { t } = useI18n(messages);
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) requestAnimationFrame(() => activeRef.current?.scrollIntoView({ block: "center" }));
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t("notes.toc")} subtitle={t("notes.chapterCount", { count: chapters.length })}>
      {chapters.map((ch, i) => (
        <button
          key={ch.key}
          ref={ch.key === active ? activeRef : undefined}
          type="button"
          onClick={() => onJump(ch.key)}
          className={cn(
            "wr:active:bg-press wr:flex wr:min-h-[44px] wr:w-full wr:items-center wr:gap-2.5 wr:px-[18px] wr:text-left wr:text-[14px]",
            ch.key === active ? "wr:bg-hover wr:text-ink-1 wr:font-semibold" : "wr:text-ink-2"
          )}
        >
          <span className="wr:font-tau-mono wr:text-ink-3 wr:w-5 wr:shrink-0 wr:text-[11px] wr:tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="wr:min-w-0 wr:flex-1 wr:truncate">{ch.title}</span>
          <span className="wr:text-ink-3 wr:text-[12px] wr:tabular-nums">
            {ch.notes.length + ch.thoughts.length}
          </span>
        </button>
      ))}
    </Sheet>
  );
}
