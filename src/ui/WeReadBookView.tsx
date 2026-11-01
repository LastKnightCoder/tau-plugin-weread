/**
 * 微信读书单本笔记：一整张纸——左侧目录停靠在纸内（开关在纸顶工具行），
 * 正文列依次是书头、书评、吸顶过滤条、按章节排的划线与想法。悬停可复制、转为卡片。
 * 未连接时从 Tau 摘录还原；已连接则拉最新笔记并写回摘录。
 */

import { useState } from "react";
import { ArrowLeft, Highlighter, PanelLeft } from "lucide-react";
import { Button, FadeScroll, IconButton, Loading, Tooltip, cn } from "@tau/ui";
import { openExternal, useWeRead, useWeReadState } from "../hooks";
import { BookHeader, BookReviews, ChapterSection, NoteFilterBar, NoteToc } from "./NoteParts";
import { useBookPage } from "./useBookPage";

export function WeReadBookView({
  bookId,
  bookmark,
  bookmarkRequest,
}: {
  bookId: string;
  bookmark?: string;
  bookmarkRequest?: string;
}) {
  const { runtime } = useWeRead();
  const tocOpen = useWeReadState(state => state.prefs.tocOpen);
  const toggleToc = () => runtime.setPrefs({ tocOpen: !tocOpen });
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const {
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
  } = useBookPage({
    bookId,
    bookmark,
    bookmarkRequest,
    container: scrollEl,
    anchorTop: () => (scrollEl?.getBoundingClientRect().top ?? 0) + 72,
  });
  const showToc = tocOpen && chapters.length > 1;

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
                onCopyMarkdown={copyMarkdown}
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
