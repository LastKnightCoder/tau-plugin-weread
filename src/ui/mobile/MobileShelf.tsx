/**
 * 手机书架：工具行（统计 · 搜索 · 同步 · ⋯）→ 吸顶分类行 + 筛选面板 →「在读」竖排卡（最近 3 本）
 * → 全部（三列封面墙或一行一本的列表）。页面由宿主滚动，顶栏只有返回与标题。
 * ⋯ 打开同步面板：上次同步结果、全量重新同步、账号与连接（手机上书架是去设置页的唯一近路）。
 */

import { useState } from "react";
import {
  Ellipsis,
  KeyRound,
  LayoutGrid,
  List,
  ListFilter,
  RefreshCw,
  Search,
  SearchX,
} from "lucide-react";
import type { PluginPageContext } from "@tau/plugins";
import { Button, Input, Loading } from "@tau/ui";
import {
  SHELF_SORTS,
  STATUS_FILTERS,
  formatMinutes,
  formatReadDay,
  formatSyncedAt,
  type WeReadBook,
} from "../../model";
import { useWeReadState } from "../../hooks";
import { BookCover, ProgressBar } from "../bits";
import { CoverTile } from "../ShelfItems";
import { useShelf } from "../useShelf";
import { EmptyShelf } from "../WeReadView";
import { Pill, Section, TouchIcon } from "./parts";
import { Sheet, SheetGroup, SheetHost, SheetRow } from "./Sheet";

export function MobileShelf({
  pageContext,
  onSettings,
}: {
  pageContext: PluginPageContext;
  onSettings(): void;
}) {
  const shelf = useShelf();
  const {
    connection,
    books,
    lastSyncedAt,
    syncing,
    progress,
    layout,
    archives,
    activeArchive,
    setArchive,
    status,
    query,
    setQuery,
    visible,
    reading,
    totalMinutes,
    filtering,
    statusLabel,
    sortLabel,
    open,
    sync,
  } = shelf;
  const [searching, setSearching] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);

  if (shelf.loading) return <Loading />;

  const disconnected = connection === "none" || connection === "invalid";
  const customized = status !== "all" || shelf.sort !== "last";

  return (
    <SheetHost.Provider value={pageContext.registerDismiss}>
      <div className="wr:mx-auto wr:flex wr:min-h-full wr:w-full wr:max-w-[720px] wr:flex-col wr:pb-4">
        {books.length === 0 ? (
          <EmptyShelf
            connection={connection}
            syncing={syncing}
            progress={progress}
            onConnected={() => sync()}
            onSync={() => sync()}
            onSettings={onSettings}
          />
        ) : (
          <>
            <div className="wr:flex wr:h-11 wr:items-center wr:gap-2 wr:px-4">
              {searching ? (
                <>
                  <Input
                    autoFocus
                    lead={Search}
                    clearable
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="搜索书名或作者"
                    aria-label="搜索书名或作者"
                    wrapperClassName="wr:min-w-0 wr:flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSearching(false);
                    }}
                    className="wr:text-accent-text wr:shrink-0 wr:px-1 wr:text-[14px] wr:font-medium"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <span className="wr:text-ink-2 wr:min-w-0 wr:flex-1 wr:truncate wr:text-[12.5px] wr:tabular-nums">
                    <b className="wr:text-ink-1 wr:font-semibold">{books.length}</b> 本
                    {totalMinutes > 0 && (
                      <>
                        <span className="wr:text-ink-3 wr:mx-1">·</span>累计{" "}
                        <b className="wr:text-ink-1 wr:font-semibold">{formatMinutes(totalMinutes)}</b>
                      </>
                    )}
                    <span className="wr:text-ink-3 wr:mx-1">·</span>
                    <span className="wr:text-ink-3">
                      {syncing ? "正在同步" : formatSyncedAt(lastSyncedAt)}
                    </span>
                  </span>
                  <TouchIcon label="搜索" onClick={() => setSearching(true)}>
                    <Search size={19} strokeWidth={1.75} />
                  </TouchIcon>
                  {disconnected ? (
                    <Button variant="soft" size="sm" icon={KeyRound} onClick={onSettings}>
                      {connection === "none" ? "连接" : "重新填写"}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={RefreshCw}
                      className="wr:tabular-nums"
                      loading={syncing}
                      loadingText={progress?.total ? `同步中 ${progress.completed}/${progress.total}` : "同步中…"}
                      disabled={connection !== "valid"}
                      onClick={() => sync()}
                    >
                      同步
                    </Button>
                  )}
                  <TouchIcon label="同步与账号" onClick={() => setSyncOpen(true)}>
                    <Ellipsis size={19} strokeWidth={1.75} />
                  </TouchIcon>
                </>
              )}
            </div>

            {disconnected && (
              <div className="wr:bg-warn-soft wr:mx-4 wr:mt-1 wr:flex wr:items-start wr:gap-2.5 wr:rounded-[14px] wr:px-3 wr:py-2.5 wr:text-[12.5px] wr:leading-[1.55]">
                <KeyRound className="wr:text-warn wr:mt-px wr:size-4 wr:shrink-0" strokeWidth={1.75} />
                <span className="wr:min-w-0 wr:flex-1">
                  {connection === "invalid"
                    ? "API Key 已失效，显示的是上次同步的本地缓存，不能拉取新笔记。"
                    : "尚未连接微信读书，显示的是本地缓存。"}
                </span>
                <button type="button" onClick={onSettings} className="wr:text-accent-text wr:shrink-0 wr:font-semibold">
                  {connection === "invalid" ? "重新填写" : "去连接"}
                </button>
              </div>
            )}

            <div className="wr:bg-page wr:sticky wr:top-0 wr:z-[2] wr:flex wr:items-center wr:gap-1 wr:py-1.5 wr:pl-4 wr:pr-2">
              <div className="wr:flex wr:w-0 wr:flex-1 wr:gap-1.5 wr:overflow-x-auto wr:py-1 wr:pr-6 wr:[mask-image:linear-gradient(90deg,#000_calc(100%-26px),transparent)] wr:[scrollbar-width:none]">
                <Pill active={!activeArchive} onClick={() => setArchive("")} label="全部" count={books.length} />
                {archives.map(a => (
                  <Pill
                    key={a.name}
                    active={activeArchive === a.name}
                    onClick={() => setArchive(a.name)}
                    label={a.name}
                    count={a.count}
                  />
                ))}
              </div>
              <TouchIcon label="筛选与排列" on={customized} dot={customized} onClick={() => setFilterOpen(true)}>
                <ListFilter size={19} strokeWidth={1.75} />
              </TouchIcon>
            </div>

            {!filtering && reading.length > 0 && (
              <>
                <Section title="在读" hint={activeArchive || "最近读过的书"} />
                <div className="wr:bg-surface wr:shadow-card wr:mx-4 wr:rounded-[18px] wr:px-3.5 wr:py-0.5">
                  {reading.map(book => (
                    <ReadingRow key={book.id} book={book} onOpen={() => open(book)} />
                  ))}
                </div>
              </>
            )}

            <Section title={status === "all" ? "全部" : statusLabel} hint={`${visible.length} 本 · 按${sortLabel}`} />
            {visible.length === 0 ? (
              <div className="wr:flex wr:flex-col wr:items-center wr:gap-2 wr:py-12 wr:text-center">
                <SearchX className="wr:text-ink-3 wr:size-6" strokeWidth={1.5} />
                <p className="wr:text-tau-meta wr:text-ink-2">没有符合条件的书</p>
                <Button variant="secondary" size="sm" className="wr:mt-1" onClick={shelf.clearFilters}>
                  清除筛选
                </Button>
              </div>
            ) : layout === "list" ? (
              <div className="wr:bg-surface wr:shadow-card wr:mx-4 wr:rounded-[18px] wr:px-3.5 wr:py-0.5">
                {visible.map(book => (
                  <ListRow key={book.id} book={book} onOpen={() => open(book)} />
                ))}
              </div>
            ) : (
              <div className="wr:grid wr:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] wr:gap-x-3.5 wr:gap-y-[18px] wr:px-4">
                {visible.map(book => (
                  <CoverTile key={book.id} book={book} onOpen={() => open(book)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} shelf={shelf} />
      <SyncSheet
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        shelf={shelf}
        onSettings={() => {
          setSyncOpen(false);
          onSettings();
        }}
      />
    </SheetHost.Provider>
  );
}

/** 「在读」一行：缩略封面 · 书名 / 作者与最近阅读 · 进度 */
function ReadingRow({ book, onOpen }: { book: WeReadBook; onOpen(): void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="wr:active:bg-press wr:not-first:border-line-2 wr:not-first:border-t wr:flex wr:w-full wr:items-center wr:gap-3 wr:py-2.5 wr:text-left"
    >
      <BookCover bare book={book} className="wr:w-[34px]" />
      <span className="wr:flex wr:min-w-0 wr:flex-1 wr:flex-col wr:gap-0.5">
        <span className="wr:truncate wr:text-[14px] wr:font-semibold">{book.title}</span>
        <span className="wr:text-ink-3 wr:truncate wr:text-[11.5px]">
          {book.author}
          {book.lastRead && ` · ${formatReadDay(book.lastRead)}`}
        </span>
      </span>
      <span className="wr:flex wr:w-16 wr:shrink-0 wr:flex-col wr:items-end wr:gap-1.5 wr:text-[12px] wr:font-semibold wr:tabular-nums">
        {book.progress}%
        <ProgressBar book={book} className="wr:w-full" />
      </span>
    </button>
  );
}

/** 列表排布一行：缩略封面 · 书名 / 作者与最近阅读 · 进度与划线数 */
function ListRow({ book, onOpen }: { book: WeReadBook; onOpen(): void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="wr:active:bg-press wr:not-first:border-line-2 wr:not-first:border-t wr:flex wr:w-full wr:items-center wr:gap-3 wr:py-2.5 wr:text-left"
    >
      <BookCover bare book={book} className="wr:w-[38px]" />
      <span className="wr:flex wr:min-w-0 wr:flex-1 wr:flex-col wr:gap-0.5">
        <span className="wr:truncate wr:text-[14px] wr:font-semibold">{book.title}</span>
        <span className="wr:text-ink-3 wr:truncate wr:text-[11.5px]">
          {book.author}
          {book.lastRead && ` · ${formatReadDay(book.lastRead)}`}
        </span>
      </span>
      <span className="wr:text-ink-2 wr:flex wr:w-[84px] wr:shrink-0 wr:flex-col wr:items-end wr:gap-1.5 wr:text-[11.5px] wr:tabular-nums">
        {book.status === "unread" ? (
          <span className="wr:text-ink-3">未开始</span>
        ) : (
          <>
            <span>
              {book.status === "finished" ? "读完" : `${book.progress}%`}
              {book.notes > 0 && (
                <>
                  {" · "}
                  <b className="wr:text-ink-1 wr:font-semibold">{book.notes}</b> 划线
                </>
              )}
            </span>
            <ProgressBar book={book} className="wr:w-14" />
          </>
        )}
      </span>
    </button>
  );
}

/** 状态（本次有效）、排序与排布（写进偏好），选完即生效 */
function FilterSheet({
  open,
  onClose,
  shelf,
}: {
  open: boolean;
  onClose(): void;
  shelf: ReturnType<typeof useShelf>;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="筛选与排列">
      <SheetGroup>状态</SheetGroup>
      <div className="wr:flex wr:flex-wrap wr:gap-2 wr:px-[18px] wr:pb-3 wr:pt-1">
        {STATUS_FILTERS.map(f => (
          <Pill key={f.value} active={shelf.status === f.value} onClick={() => shelf.setStatus(f.value)} label={f.label} />
        ))}
      </div>
      <SheetGroup>排序</SheetGroup>
      {SHELF_SORTS.map(s => (
        <SheetRow key={s.value} label={s.label} checked={shelf.sort === s.value} onClick={() => shelf.setSort(s.value)} />
      ))}
      <SheetGroup>排布</SheetGroup>
      <SheetRow
        icon={<LayoutGrid size={19} strokeWidth={1.75} />}
        label="封面"
        checked={shelf.layout === "cover"}
        onClick={() => shelf.setLayout("cover")}
      />
      <SheetRow
        icon={<List size={19} strokeWidth={1.75} />}
        label="列表"
        checked={shelf.layout === "list"}
        onClick={() => shelf.setLayout("list")}
      />
    </Sheet>
  );
}

/** 同步面板：上次同步结果 · 全量重新同步 · 账号与连接 */
function SyncSheet({
  open,
  onClose,
  shelf,
  onSettings,
}: {
  open: boolean;
  onClose(): void;
  shelf: ReturnType<typeof useShelf>;
  onSettings(): void;
}) {
  const outcome = useWeReadState(state => state.lastOutcome);
  const { connection, syncing, progress, lastSyncedAt, books } = shelf;
  const summary = syncing
    ? progress?.total
      ? `正在同步 ${progress.completed} / ${progress.total}`
      : "正在同步…"
    : [
        formatSyncedAt(lastSyncedAt),
        outcome && `更新 ${outcome.updated} 本`,
        outcome?.failed && `${outcome.failed} 本下次重试`,
      ]
        .filter(Boolean)
        .join(" · ");
  return (
    <Sheet open={open} onClose={onClose} title="同步" subtitle={summary}>
      <SheetRow
        icon={<RefreshCw size={19} strokeWidth={1.75} />}
        label="全量重新同步"
        hint={`把整个书架重新拉一遍，约 ${books.length * 2} 个请求，书多时较慢；同步期间尽量不要切到后台。`}
        disabled={connection !== "valid" || syncing}
        onClick={() => {
          onClose();
          shelf.sync(true);
        }}
      />
      <SheetRow
        icon={<KeyRound size={19} strokeWidth={1.75} />}
        label="账号与连接"
        hint={
          connection === "valid"
            ? "已连接 · 更换或断开 API Key"
            : connection === "invalid"
              ? "API Key 已失效，重新填写"
              : "尚未连接"
        }
        onClick={onSettings}
      />
    </Sheet>
  );
}
