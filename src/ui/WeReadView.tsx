/**
 * 微信读书书架：工具栏（标题 · 统计与同步状态 · 搜索 · 同步）→ 分类 pills + 状态 / 排序 / 排布
 * →「在读」续读行 → 全部书籍（封面墙或行式列表）。点书进入单书笔记页。
 * 未连接时照常展示本地缓存；首次使用在纸内引导填 API Key。
 */

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  BookOpen,
  ChevronDown,
  KeyRound,
  LayoutGrid,
  List,
  ListFilter,
  RefreshCw,
  Search,
  SearchX,
} from "lucide-react";
import { Button, FadeScroll, FilterPill, Input, Loading, Menu, cn, toast } from "@tau/ui";
import {
  SHELF_SORTS,
  STATUS_FILTERS,
  formatMinutes,
  formatSyncedAt,
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
import type { Connection } from "../runtime";
import { ConnectPanel } from "./ConnectPanel";
import { CoverTile, ReadingCard, ShelfList } from "./ShelfItems";

const LAYOUTS: { value: ShelfLayout; label: string; icon: typeof LayoutGrid }[] = [
  { value: "cover", label: "封面", icon: LayoutGrid },
  { value: "list", label: "列表", icon: List },
];

export function WeReadView({ onSettings }: { onSettings(): void }) {
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

  const open = (book: WeReadBook) => void pages.book.open({ bookId: book.id });
  const setSort = (value: ShelfSort) => runtime.setPrefs({ sort: value });
  const sync = (full = false) =>
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
  const toSettings = onSettings;

  if (loading) return <Loading />;

  const filtering = status !== "all" || query.trim().length > 0;
  const statusLabel = STATUS_FILTERS.find(f => f.value === status)?.label ?? "";
  const sortLabel = SHELF_SORTS.find(s => s.value === sort)?.label ?? "";

  const syncButton =
    connection === "none" || connection === "invalid" ? (
      <Button
        variant="secondary"
        size="sm"
        icon={KeyRound}
        className="wr:shrink-0"
        onClick={toSettings}
      >
        连接微信读书
      </Button>
    ) : (
      <span className="wr:flex wr:shrink-0 wr:items-center">
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          className="wr:rounded-r-none wr:tabular-nums"
          loading={syncing}
          loadingText={
            progress?.total ? `同步中 ${progress.completed}/${progress.total}` : "同步中…"
          }
          disabled={connection !== "valid"}
          title="只更新新书和最近读过、记过笔记的书"
          onClick={() => sync()}
        >
          同步
        </Button>
        <Menu
          align="end"
          trigger={
            <Button
              variant="secondary"
              size="sm"
              aria-label="更多同步选项"
              disabled={connection !== "valid" || syncing}
              className="wr:-ml-px wr:rounded-l-none wr:px-1.5"
            >
              <ChevronDown className="wr:size-3.5" strokeWidth={1.75} />
            </Button>
          }
        >
          <Menu.Item
            icon={<RefreshCw className="wr:size-[15px]" strokeWidth={1.75} />}
            onSelect={() => sync(true)}
          >
            全量重新同步
            <span className="wr:text-ink-3 wr:ml-1.5 wr:tabular-nums">
              约 {books.length * 2} 个请求
            </span>
          </Menu.Item>
        </Menu>
      </span>
    );

  return (
    <div className="wr:mx-auto wr:flex wr:h-full wr:min-h-0 wr:w-full wr:max-w-[1720px] wr:flex-col wr:px-4 wr:pb-4 wr:pt-1">
      {/* 一整张纸：页头与筛选行固定在纸顶，书目在纸内滚动 */}
      <div className="wr:bg-surface wr:shadow-card wr:rounded-tau-lg wr:flex wr:min-h-0 wr:flex-1 wr:flex-col wr:overflow-hidden">
        <div className="wr:flex wr:flex-none wr:flex-col wr:px-8 wr:pt-5">
          <div className="wr:flex wr:h-10 wr:flex-none wr:items-center wr:gap-3">
            <h1 className="wr:text-tau-title-lg wr:shrink-0 wr:font-semibold wr:tracking-[-0.01em]">
              微信读书
            </h1>
            <span className="wr:text-tau-meta wr:text-ink-2 wr:w-0 wr:flex-1 wr:truncate wr:whitespace-nowrap wr:tabular-nums">
              {books.length > 0 && (
                <>
                  <b className="wr:text-ink-1 wr:font-semibold">{books.length}</b> 本书
                  {totalMinutes > 0 && (
                    <>
                      <span className="wr:text-ink-3 wr:mx-1.5">·</span>累计阅读{" "}
                      <b className="wr:text-ink-1 wr:font-semibold">
                        {formatMinutes(totalMinutes)}
                      </b>
                    </>
                  )}
                  <span className="wr:text-ink-3 wr:mx-1.5">·</span>
                  <span className="wr:text-ink-3">{formatSyncedAt(lastSyncedAt)}</span>
                </>
              )}
            </span>
            {books.length > 0 && (
              <Input
                size="sm"
                lead={Search}
                clearable
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Escape" && query) {
                    e.stopPropagation();
                    setQuery("");
                  }
                }}
                placeholder="搜索书名或作者"
                className="wr:w-0"
                wrapperClassName="wr:w-auto wr:max-w-[240px] wr:flex-[0_1_240px]"
              />
            )}
            {(books.length > 0 || connection !== "none") && syncButton}
          </div>

          {books.length > 0 && (connection === "invalid" || connection === "none") && (
            <div className="wr:bg-warn-soft wr:text-tau-meta wr:mt-2 wr:flex wr:flex-none wr:items-center wr:gap-2.5 wr:rounded-[12px] wr:px-3 wr:py-2">
              <KeyRound className="wr:text-warn wr:size-4 wr:shrink-0" strokeWidth={1.75} />
              <span className="wr:min-w-0 wr:flex-1">
                {connection === "invalid"
                  ? "API Key 已失效，当前显示的是上次同步的本地缓存，不能拉取新笔记。"
                  : "尚未连接微信读书，当前显示的是本地缓存。"}
              </span>
              <button
                type="button"
                onClick={toSettings}
                className="wr:text-accent-text wr:shrink-0 wr:font-medium wr:hover:underline"
              >
                {connection === "invalid" ? "重新填写" : "去连接"}
              </button>
            </div>
          )}

          {books.length > 0 && (
            <div className="wr:mt-2 wr:flex wr:h-10 wr:flex-none wr:items-center wr:gap-1.5">
              {/* w-0 + flex-1：分类再多也只在自身范围内横向滚动，不撑宽页面 */}
              <div className="wr:flex wr:w-0 wr:flex-1 wr:items-center wr:gap-1.5 wr:overflow-x-auto wr:py-1 wr:pr-6 wr:[mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)]">
                <FilterPill
                  active={!activeArchive}
                  onClick={() => setArchive("")}
                  label="全部"
                  count={books.length}
                />
                {archives.map(a => (
                  <FilterPill
                    key={a.name}
                    active={activeArchive === a.name}
                    onClick={() => setArchive(a.name)}
                    label={a.name}
                    count={a.count}
                  />
                ))}
              </div>
              <Menu
                align="end"
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ListFilter}
                    className={cn("wr:shrink-0", status !== "all" && "wr:text-accent-text")}
                  >
                    {statusLabel}
                    <ChevronDown className="wr:text-ink-3 wr:size-3.5" strokeWidth={1.75} />
                  </Button>
                }
              >
                <Menu.RadioGroup
                  value={status}
                  onValueChange={v => setStatus(v as ShelfStatusFilter)}
                >
                  {STATUS_FILTERS.map(f => (
                    <Menu.RadioItem key={f.value} value={f.value}>
                      {f.label}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu>
              <Menu
                align="end"
                trigger={
                  <Button variant="ghost" size="sm" icon={ArrowDownUp} className="wr:shrink-0">
                    {sortLabel}
                    <ChevronDown className="wr:text-ink-3 wr:size-3.5" strokeWidth={1.75} />
                  </Button>
                }
              >
                <Menu.RadioGroup value={sort} onValueChange={v => setSort(v as ShelfSort)}>
                  {SHELF_SORTS.map(s => (
                    <Menu.RadioItem key={s.value} value={s.value}>
                      {s.label}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu>
              <Menu
                align="end"
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={layout === "list" ? List : LayoutGrid}
                    className="wr:shrink-0"
                  >
                    {LAYOUTS.find(l => l.value === layout)?.label}
                    <ChevronDown className="wr:text-ink-3 wr:size-3.5" strokeWidth={1.75} />
                  </Button>
                }
              >
                <Menu.RadioGroup
                  value={layout}
                  onValueChange={v => runtime.setPrefs({ layout: v as ShelfLayout })}
                >
                  {LAYOUTS.map(l => (
                    <Menu.RadioItem key={l.value} value={l.value}>
                      {l.label}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu>
            </div>
          )}
        </div>

        <FadeScroll className="wr:mb-4 wr:min-h-0 wr:flex-1 wr:pb-4 wr:pl-8 wr:pr-[26px] wr:pt-3">
          {books.length === 0 ? (
            <EmptyShelf
              connection={connection}
              syncing={syncing}
              progress={progress}
              onConnected={() => sync()}
              onSync={() => sync()}
              onSettings={toSettings}
            />
          ) : (
            <>
              {!filtering && reading.length > 0 && (
                <section className="wr:mb-6">
                  <SectionTitle title="在读" hint="最近读过的书" />
                  <div className="wr:-mx-3.5 wr:grid wr:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] wr:gap-1">
                    {reading.map(book => (
                      <ReadingCard key={book.id} book={book} onOpen={() => open(book)} />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <SectionTitle
                  title={status === "all" ? "全部" : statusLabel}
                  hint={`${visible.length} 本 · 按${sortLabel}`}
                />
                {visible.length === 0 ? (
                  <div className="wr:flex wr:flex-col wr:items-center wr:gap-2 wr:py-16 wr:text-center">
                    <SearchX className="wr:text-ink-3 wr:size-6" strokeWidth={1.5} />
                    <p className="wr:text-tau-meta wr:text-ink-2">没有符合条件的书</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="wr:mt-1"
                      onClick={() => {
                        setQuery("");
                        setStatus("all");
                      }}
                    >
                      清除筛选
                    </Button>
                  </div>
                ) : layout === "list" ? (
                  <ShelfList books={visible} sort={sort} onSort={setSort} onOpen={open} />
                ) : (
                  <div className="wr:grid wr:grid-cols-[repeat(auto-fill,minmax(118px,1fr))] wr:gap-x-[22px] wr:gap-y-6">
                    {visible.map(book => (
                      <CoverTile key={book.id} book={book} onOpen={() => open(book)} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </FadeScroll>
      </div>
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <h2 className="wr:mb-3 wr:flex wr:items-baseline wr:gap-2 wr:px-0.5 wr:text-[13.5px] wr:font-semibold">
      {title}
      {hint && (
        <small className="wr:text-tau-sm wr:text-ink-3 wr:font-normal wr:tabular-nums">
          {hint}
        </small>
      )}
    </h2>
  );
}

function EmptyShelf({
  connection,
  syncing,
  progress,
  onConnected,
  onSync,
  onSettings,
}: {
  connection: Connection;
  syncing: boolean;
  progress: { completed: number; total: number } | null;
  onConnected(): void;
  onSync(): void;
  onSettings(): void;
}) {
  if (connection === "none") return <ConnectPanel onConnected={onConnected} />;
  if (syncing)
    return (
      <Loading
        label={
          progress?.total
            ? `正在同步书架 ${progress.completed} / ${progress.total}`
            : "正在同步书架…"
        }
      />
    );
  if (connection === "checking") return <Loading label="正在校验 API Key…" />;
  const invalid = connection === "invalid";
  return (
    <div className="wr:flex wr:flex-col wr:items-center wr:gap-2 wr:px-5 wr:py-20 wr:text-center">
      <span className="wr:bg-accent-soft wr:text-accent-text wr:mb-1.5 wr:grid wr:size-[52px] wr:place-items-center wr:rounded-[16px]">
        <BookOpen className="wr:size-6" strokeWidth={1.5} />
      </span>
      <p className="wr:text-ink-1 wr:text-[15px] wr:font-semibold">
        {invalid ? "API Key 已失效" : "书架还是空的"}
      </p>
      <p className="wr:text-tau-meta wr:text-ink-2 wr:max-w-[36ch]">
        {invalid ? "重新填写 API Key 后即可同步书架。" : "同步一次，把微信读书书架上的书带进来。"}
      </p>
      <div className="wr:mt-2.5">
        {invalid ? (
          <Button variant="soft" size="sm" icon={KeyRound} onClick={onSettings}>
            重新填写
          </Button>
        ) : (
          <Button variant="soft" size="sm" icon={RefreshCw} onClick={onSync}>
            同步书架
          </Button>
        )}
      </div>
    </div>
  );
}
