/* eslint-disable react-refresh/only-export-components -- 插件入口默认导出插件定义。 */
import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { definePlugin, SIDEBAR_GROUPS, type PluginPageProps } from "@tau/plugins";
import { toast } from "@tau/ui";
import "./styles.css";
import { messages } from "./i18n";
import { RuntimeProvider, type WeReadPages } from "./hooks";
import { WeReadRuntime } from "./runtime";
import { WeReadView } from "./ui/WeReadView";
import { WeReadBookView } from "./ui/WeReadBookView";
import { WeReadSettings } from "./ui/WeReadSettings";
import { MobileBook } from "./ui/mobile/MobileBook";
import { MobileShelf } from "./ui/mobile/MobileShelf";

declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  ...__PLUGIN_META__,
  i18n: messages,
  create: () => ({
    activate(context) {
      const t = context.i18n.t;
      const runtime = new WeReadRuntime(context);
      // 页面句柄在注册后才有，组件渲染时读取
      const pages = {} as WeReadPages;
      const wrap = (children: ReactNode) => (
        <RuntimeProvider runtime={runtime} pages={pages}>
          {children}
        </RuntimeProvider>
      );

      // 手机另有一套为触控设计的书架与单书页；数据、同步与摘录口径两端共用
      const mobile =
        context.environment.platform === "android" || context.environment.platform === "ios";

      const settings = context.settings.register({
        id: "connection",
        title: messages.ref("settings.title"),
        description: t("settings.description"),
        component: () => wrap(<WeReadSettings />),
      });
      const openSettings = () => void settings.open();
      pages.shelf = context.pages.register({
        id: "shelf",
        title: messages.ref("page.title"),
        component: ({ pageContext }: PluginPageProps) =>
          wrap(
            mobile ? (
              <MobileShelf pageContext={pageContext} onSettings={openSettings} />
            ) : (
              <WeReadView onSettings={openSettings} />
            )
          ),
      });
      pages.book = context.pages.register({
        id: "book",
        title: messages.ref("page.title"),
        match: "params",
        getId: params => String(params.bookId),
        component: ({ params, pageContext }: PluginPageProps) => {
          const bookId = String(params.bookId);
          const bookmark = typeof params.bookmark === "string" ? params.bookmark : undefined;
          const bookmarkRequest =
            typeof params.bookmarkRequest === "string" ? params.bookmarkRequest : undefined;
          return wrap(
            mobile ? (
              <MobileBook
                bookId={bookId}
                bookmark={bookmark}
                bookmarkRequest={bookmarkRequest}
                pageContext={pageContext}
              />
            ) : (
              <WeReadBookView
                bookId={bookId}
                bookmark={bookmark}
                bookmarkRequest={bookmarkRequest}
              />
            )
          );
        },
      });
      // 桌面挂侧边栏「学习」组；手机没有侧边栏，入口在「我的」功能宫格
      if (mobile)
        context.navigation.registerEntry({
          id: "shelf",
          title: messages.ref("page.title"),
          icon: BookOpen,
          page: pages.shelf,
        });
      else
        context.sidebar.registerItem({
          id: "shelf",
          title: messages.ref("page.title"),
          icon: BookOpen,
          group: SIDEBAR_GROUPS.learning,
          page: pages.shelf,
        });
      // externalId = bookId:bookmarkId 或 bookId:review:reviewId；单书页以 bookmarkId / reviewId 标识每条
      context.excerpts.register({
        label: t("page.title"),
        open: ({ sourceKey, externalId }) => {
          const bookmark = externalId.slice(sourceKey.length + 1).replace(/^review:/, "");
          return pages.book.open({
            bookId: sourceKey,
            ...(bookmark ? { bookmark, bookmarkRequest: crypto.randomUUID() } : {}),
          });
        },
      });
      context.commands.register({
        id: "open",
        title: messages.ref("command.open"),
        run: async () => {
          await pages.shelf.open();
          return null;
        },
      });
      context.commands.register({
        id: "sync",
        title: messages.ref("command.sync"),
        run: async () => {
          const outcome = await runtime.sync();
          if (!outcome) toast.error(t("sync.connectFirst"));
          else toast.success(t("sync.done", { total: outcome.total }));
          return null;
        },
      });
      // 读取存储与校验不阻塞激活
      void runtime.load().catch(error => {
        if (!context.signal.aborted) console.error("[weread] 初始化失败", error);
      });
    },
  }),
});
