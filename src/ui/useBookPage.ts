/**
 * 单书笔记页的状态：笔记与过滤、当前章节、摘录定位、转为卡片。桌面与手机共用。
 * 滚动容器由调用方给定的元素内查找章节与条目；滚动事件在 document 捕获阶段监听，
 * 不论由插件自己的 FadeScroll 还是宿主页面滚动都能收到。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@tau/ui";
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
import { scrollToAndFlash, useBookDetail, useWeRead, useWeReadState } from "../hooks";

export function useBookPage({
  bookId,
  bookmark,
  bookmarkRequest,
  container,
  anchorTop,
}: {
  bookId: string;
  bookmark?: string;
  bookmarkRequest?: string;
  /** 章节与条目所在的元素 */
  container: HTMLElement | null;
  /** 视口坐标：章节标题滚过这条线即算当前章节 */
  anchorTop(): number;
}) {
  const { runtime, pages } = useWeRead();
  const connected = useWeReadState(state => state.connection === "valid");
  const { detail, loading, refreshing, refresh } = useBookDetail(bookId);

  const [filter, setFilter] = useState<NoteFilter>("all");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const book = useMemo(() => (detail ? toBook(detail.notebook) : null), [detail]);
  const notes = useMemo(() => (detail ? buildBookNotes(detail.notebook) : null), [detail]);
  const chapters = useMemo(() => (notes ? filterNotes(notes, filter) : []), [notes, filter]);
  const counts = useMemo(() => countNotes(notes?.chapters ?? []), [notes]);
  const colors = useMemo(() => {
    const set = new Set<HighlightColor>();
    notes?.chapters.forEach(ch => ch.notes.forEach(n => n.paragraphs.length && set.add(n.color)));
    return [...set];
  }, [notes]);

  // 当前章节：滚过锚线的最后一个章节
  const anchor = useRef(anchorTop);
  anchor.current = anchorTop;
  useEffect(() => {
    if (!container) return;
    const update = () => {
      const top = anchor.current();
      let current: string | null = null;
      for (const el of container.querySelectorAll<HTMLElement>("[data-chapter]")) {
        if (el.getBoundingClientRect().top <= top) current = el.dataset.chapter ?? null;
        else break;
      }
      setActiveKey(current ?? chapters[0]?.key ?? null);
    };
    update();
    const doc = container.ownerDocument;
    doc.addEventListener("scroll", update, { capture: true, passive: true });
    return () => doc.removeEventListener("scroll", update, { capture: true });
  }, [container, chapters]);

  // 同一请求只定位一次；保活恢复不重新拉回，重复打开由请求标识重新触发。
  const pendingBookmark = useRef<string | null>(null);
  const handledRequest = useRef<string | null>(null);
  const locationRequest = JSON.stringify([bookId, bookmark ?? null, bookmarkRequest ?? null]);
  useEffect(() => {
    if (handledRequest.current === locationRequest) return;
    handledRequest.current = locationRequest;
    pendingBookmark.current = bookmark ?? null;
    if (bookmark) setFilter("all");
  }, [bookmark, locationRequest]);
  useEffect(() => {
    const target = pendingBookmark.current;
    if (!target || !container || filter !== "all") return;
    const el = container.querySelector(`[data-note-id="${CSS.escape(target)}"]`);
    if (!el) return;
    pendingBookmark.current = null;
    scrollToAndFlash(el);
  }, [container, chapters, filter, locationRequest]);

  // 单书页的条目 id 是 bookmarkId（划线）或 reviewId（只有想法），对应摘录的两种外部 id
  const runAction = useCallback(
    async (note: BookNote, actionId: string) => {
      const ids = [`${bookId}:${note.id}`, `${bookId}:review:${note.id}`];
      const entry = detail?.entries.find(item => ids.includes(item.externalId) && !item.deleted);
      if (!entry) {
        throw new Error("这条划线还没有同步为摘录，请稍后重试");
      }
      const actions = await runtime.context.materials.actions(entry.ref);
      const action = actions.find(item => item.id === actionId);
      if (!action) throw new Error("当前客户端不支持此操作");
      await action.run();
    },
    [bookId, detail, runtime]
  );
  const running = useRef(false);
  const toCard = useCallback(
    (note: BookNote) => {
      if (running.current) return;
      running.current = true;
      void (async () => {
        try {
          await runAction(note, "card");
        } catch (error) {
          if (!runtime.context.signal.aborted)
            toast.error(error instanceof Error ? error.message : String(error) || "转为卡片失败");
        } finally {
          running.current = false;
        }
      })();
    },
    [runAction, runtime]
  );

  const jump = useCallback(
    (key: string) => {
      container
        ?.querySelector(`[data-chapter="${CSS.escape(key)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [container]
  );

  const empty = !notes || (notes.chapters.length === 0 && notes.bookReviews.length === 0);
  const status = detail?.error
    ? `拉取失败，显示的是本地缓存：${detail.error}`
    : !connected
      ? "未连接微信读书，显示的是本地缓存"
      : null;
  const copyMarkdown =
    book && notes && !empty
      ? () =>
          void window.navigator.clipboard
            .writeText(notesToMarkdown(book, notes))
            .then(() => toast.success("已复制为 Markdown"))
      : undefined;

  return {
    pages,
    connected,
    detail,
    loading,
    refreshing,
    refresh,
    book,
    notes,
    chapters,
    counts,
    colors,
    filter,
    setFilter,
    activeKey,
    toCard,
    jump,
    empty,
    status,
    copyMarkdown,
  };
}
