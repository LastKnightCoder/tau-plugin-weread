/** 书架页的状态与派生数据：桌面与手机共用，只是排布不同 */

import { useMemo, useState } from "react";
import { toast } from "@tau/ui";
import {
  SHELF_SORTS,
  STATUS_FILTERS,
  matchQuery,
  matchStatus,
  rankArchives,
  readingNow,
  sortBooks,
  toBook,
  type ShelfLayout,
  type ShelfSort,
  type ShelfStatusFilter,
  type WeReadBook,
} from "../model";
import { useWeRead, useWeReadState } from "../hooks";
import type { WeReadRuntime } from "../runtime";

/** 同步并提示结果；书架与设置页共用 */
export function syncWithToast(runtime: WeReadRuntime, full = false) {
  void runtime.sync({ full }).then(
    outcome => {
      if (!outcome) return;
      toast.success(
        `同步完成，共 ${outcome.total} 本书，更新 ${outcome.updated} 本` +
          (outcome.failed ? `，${outcome.failed} 本下次重试` : "")
      );
    },
    error => toast.error(error instanceof Error ? error.message : "同步失败，请稍后再试")
  );
}

export function useShelf() {
  const { runtime, pages } = useWeRead();
  const connection = useWeReadState(state => state.connection);
  const metas = useWeReadState(state => state.books);
  const lastSyncedAt = useWeReadState(state => state.lastSyncedAt);
  const loading = useWeReadState(state => !state.loaded);
  const syncing = useWeReadState(state => state.syncing);
  const progress = useWeReadState(state => state.progress);
  const { layout, sort } = useWeReadState(state => state.prefs);
  const books = useMemo(
    () =>
      metas.map(metaData =>
        toBook({
          metaData,
          chapterHighlights: [],
          bookReview: { chapterReviews: [], bookReviews: [] },
        })
      ),
    [metas]
  );

  const [archive, setArchive] = useState("");
  const [status, setStatus] = useState<ShelfStatusFilter>("all");
  const [query, setQuery] = useState("");

  const archives = useMemo(() => rankArchives(books), [books]);
  // 分类被同步掉后回到全部
  const activeArchive = archives.some(a => a.name === archive) ? archive : "";
  const inArchive = useMemo(
    () => (activeArchive ? books.filter(b => b.archive === activeArchive) : books),
    [books, activeArchive]
  );
  const visible = useMemo(
    () =>
      sortBooks(
        inArchive.filter(b => matchStatus(b, status) && matchQuery(b, query)),
        sort
      ),
    [inArchive, status, query, sort]
  );
  const reading = useMemo(() => readingNow(inArchive), [inArchive]);
  const totalMinutes = useMemo(() => books.reduce((sum, b) => sum + b.minutes, 0), [books]);

  const sync = (full = false) => syncWithToast(runtime, full);

  return {
    connection,
    books,
    lastSyncedAt,
    loading,
    syncing,
    progress,
    layout,
    sort,
    archives,
    activeArchive,
    setArchive,
    status,
    setStatus,
    query,
    setQuery,
    visible,
    reading,
    totalMinutes,
    filtering: status !== "all" || query.trim().length > 0,
    statusLabel: STATUS_FILTERS.find(f => f.value === status)?.label ?? "",
    sortLabel: SHELF_SORTS.find(s => s.value === sort)?.label ?? "",
    open: (book: WeReadBook) => void pages.book.open({ bookId: book.id }),
    setSort: (value: ShelfSort) => runtime.setPrefs({ sort: value }),
    setLayout: (value: ShelfLayout) => runtime.setPrefs({ layout: value }),
    clearFilters: () => {
      setQuery("");
      setStatus("all");
    },
    sync,
  };
}
