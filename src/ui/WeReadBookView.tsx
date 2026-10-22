/**
 * 微信读书单本笔记：一整张纸——左侧目录停靠在纸内（开关在纸顶工具行），
 * 正文列依次是书头、书评、吸顶过滤条、按章节排的划线与想法。悬停可复制、转为卡片或问题。
 * 未连接时从 Tau 摘录还原；已连接则拉最新笔记并写回摘录。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Highlighter, PanelLeft } from "lucide-react";
import { Button, FadeScroll, IconButton, Loading, Tooltip, cn, toast } from "@tau/ui";
import {
  buildBookNotes,
  countNotes,
  filterNotes,
  notesToMarkdown,
  toBook,
  type BookNote,
  type HighlightColor,
  type NoteFilter,
} from "../model";
import { openExternal, scrollToAndFlash, useBookDetail, useWeRead, useWeReadState } from "../hooks";
import { BookHeader, BookReviews, ChapterSection, NoteFilterBar, NoteToc } from "./NoteParts";

export function WeReadBookView({ bookId, bookmark }: { bookId: string; bookmark?: string }) {
  const { runtime, pages } = useWeRead();
  const connected = useWeReadState(state => state.connection === "valid");
  const tocOpen = useWeReadState(state => state.prefs.tocOpen);
  const { detail, loading, refreshing, refresh } = useBookDetail(bookId);
  const toggleToc = () => runtime.setPrefs({ tocOpen: !tocOpen });

  const [filter, setFilter] = useState<NoteFilter>("all");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  const book = useMemo(() => (detail ? toBook(detail.notebook) : null), [detail]);
  const notes = useMemo(() => (detail ? buildBookNotes(detail.notebook) : null), [detail]);
  const chapters = useMemo(() => (notes ? filterNotes(notes, filter) : []), [notes, filter]);
  const counts = useMemo(() => countNotes(notes?.chapters ?? []), [notes]);
  const colors = useMemo(() => {
    const set = new Set<HighlightColor>();
    notes?.chapters.forEach(ch => ch.notes.forEach(n => n.paragraphs.length && set.add(n.color)));
    return [...set];
  }, [notes]);
  const showToc = tocOpen && chapters.length > 1;

  // 目录高亮：正文滚过的最后一个章节
  useEffect(() => {
    if (!scrollEl) return;
    const update = () => {
      const top = scrollEl.getBoundingClientRect().top + 72;
      let current: string | null = null;
      for (const el of scrollEl.querySelectorAll<HTMLElement>("[data-chapter]")) {
        if (el.getBoundingClientRect().top <= top) current = el.dataset.chapter ?? null;
        else break;
      }
      setActiveKey(current ?? chapters[0]?.key ?? null);
    };
    update();
    scrollEl.addEventListener("scroll", update, { passive: true });
    return () => scrollEl.removeEventListener("scroll", update);
  }, [scrollEl, chapters]);

  // 摘录打开到原处：清掉筛选，等笔记渲染后滚到那一条（每个 bookmark 只定位一次）；找不到就停在书首
  const pendingBookmark = useRef<string | null>(null);
  useEffect(() => {
    pendingBookmark.current = bookmark ?? null;
    if (bookmark) setFilter("all");
  }, [bookmark]);
  useEffect(() => {
    const target = pendingBookmark.current;
    if (!target || !scrollEl || filter !== "all") return;
    const el = scrollEl.querySelector(`[data-note-id="${CSS.escape(target)}"]`);
    if (!el) return;
    pendingBookmark.current = null;
    scrollToAndFlash(el);
  }, [scrollEl, chapters, filter]);

  // 单书页的条目 id 是 bookmarkId（划线）或 reviewId（只有想法），对应摘录的两种外部 id
  const runAction = useCallback(
    async (note: BookNote, actionId: string) => {
      const ids = [`${bookId}:${note.id}`, `${bookId}:review:${note.id}`];
      const entry = detail?.entries.find(item => ids.includes(item.externalId) && !item.deleted);
      if (!entry) {
        toast.error("这条划线还没有同步为摘录，请稍后重试");
        return;
      }
      const actions = await runtime.context.materials.actions(entry.ref);
      const action = actions.find(item => item.id === actionId);
      if (!action) toast.error("当前客户端不支持此操作");
      else await action.run();
    },
    [bookId, detail, runtime]
  );
  const toCard = useCallback((note: BookNote) => void runAction(note, "card"), [runAction]);

  const jump = useCallback(
    (key: string) => {
      scrollEl
        ?.querySelector(`[data-chapter="${CSS.escape(key)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [scrollEl]
  );

  if (loading) return <Loading />;

  if (!detail || !book || !notes) {
    return (
      <div className="wr:flex wr:h-full wr:flex-col wr:items-center wr:justify-center wr:gap-2 wr:text-center">
        <p className="wr:text-ink-1 wr:text-[15px] wr:font-semibold">书架上找不到这本书</p>
        <p className="wr:text-tau-meta wr:text-ink-2">
          可能已从微信读书书架移除，或属于另一个工作区。
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="wr:mt-2"
          onClick={() => void pages.shelf.open()}
        >
          回到书架
        </Button>
      </div>
    );
  }

  const empty = notes.chapters.length === 0 && notes.bookReviews.length === 0;
  const status = detail.error
    ? `拉取失败，显示的是本地缓存：${detail.error}`
    : !connected
      ? "未连接微信读书，显示的是本地缓存"
      : null;

  return (
    <div className="wr:mx-auto wr:flex wr:h-full wr:min-h-0 wr:w-full wr:max-w-[1720px] wr:flex-col wr:px-4 wr:pb-4 wr:pt-1">
      <div className="wr:bg-surface wr:shadow-card wr:rounded-tau-lg wr:flex wr:min-h-0 wr:flex-1 wr:overflow-hidden">
        {/* 外层只管收起动画的宽度，滚动交给 FadeScroll（其右侧透明边收起时也不占位） */}
        <div
          className={cn(
            "wr:ease-tau-out wr:flex wr:shrink-0 wr:overflow-hidden wr:transition-[width,opacity] wr:duration-[240ms]",
            showToc ? "wr:w-[232px] wr:opacity-100" : "wr:w-0 wr:opacity-0"
          )}
        >
          <FadeScroll className="wr:my-4 wr:w-[232px] wr:shrink-0 wr:py-1 wr:pl-3.5 wr:pr-1">
            {chapters.length > 1 && (
              <NoteToc chapters={chapters} active={activeKey} onJump={jump} />
            )}
          </FadeScroll>
        </div>
        <div className="wr:flex wr:min-w-0 wr:flex-1 wr:flex-col">
          <div className="wr:flex wr:flex-none wr:items-center wr:gap-1 wr:px-3 wr:pt-3">
            <Tooltip content={tocOpen ? "收起目录" : "展开目录"} placement="bottom">
              <IconButton
                onClick={toggleToc}
                aria-label={tocOpen ? "收起目录" : "展开目录"}
                aria-expanded={tocOpen}
                disabled={chapters.length <= 1}
              >
                <PanelLeft size={17} strokeWidth={1.75} />
              </IconButton>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => void pages.shelf.open()}
            >
              书架
            </Button>
          </div>
          <FadeScroll scrollRef={setScrollEl} className="wr:mb-4 wr:min-h-0 wr:min-w-0 wr:flex-1">
            <div className="wr:mx-auto wr:max-w-[720px] wr:px-9 wr:pb-12 wr:pt-1">
              <BookHeader
                book={book}
                counts={counts}
                connected={connected}
                refreshing={refreshing}
                onRefresh={refresh}
                onOpenWeb={book.webUrl ? () => openExternal(book.webUrl) : undefined}
                onCopyMarkdown={
                  empty
                    ? undefined
                    : () =>
                        void window.navigator.clipboard
                          .writeText(notesToMarkdown(book, notes))
                          .then(() => toast.success("已复制为 Markdown"))
                }
              />
              {status && <p className="wr:text-tau-sm wr:text-warn wr:mt-3">{status}</p>}
              <BookReviews reviews={notes.bookReviews} />
              {empty ? (
                <div className="wr:flex wr:flex-col wr:items-center wr:gap-2 wr:py-20 wr:text-center">
                  <Highlighter className="wr:text-ink-3 wr:size-7" strokeWidth={1.5} />
                  <p className="wr:text-ink-1 wr:text-[15px] wr:font-semibold">
                    {refreshing ? "正在拉取笔记…" : "这本书还没有划线"}
                  </p>
                  {!refreshing && (
                    <p className="wr:text-tau-meta wr:text-ink-2 wr:max-w-[36ch]">
                      在微信读书里划线或写想法后，回到这里点「重新拉取笔记」。
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <NoteFilterBar filter={filter} colors={colors} onChange={setFilter} />
                  {chapters.map(chapter => (
                    <ChapterSection
                      key={chapter.key}
                      chapter={chapter}
                      index={notes.chapters.findIndex(c => c.key === chapter.key)}
                      onToCard={toCard}
                    />
                  ))}
                </>
              )}
            </div>
          </FadeScroll>
        </div>
      </div>
    </div>
  );
}
