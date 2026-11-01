# 兼容性与开发验证

当前依赖 SDK 0.56.0、UI 0.6.0；插件版本与最低客户端版本以 manifest.json 为准。使用格式 3，声明 desktop、android、ios；保留插件 ID、原有数据字段与功能，统一安装包协议。

## 平台边界

两端共用运行时、同步、摘录口径与私有存储，只是界面不同：`context.environment.platform` 为 android / ios 时，书架与单书页渲染 `src/ui/mobile/`，入口用 `navigation.registerEntry`（「我的」功能宫格）；桌面仍用 `sidebar.registerItem` 挂「学习」组。书架与单书页的状态在 `src/ui/useShelf.ts`、`src/ui/useBookPage.ts`，两端各自排布。

手机依赖宿主提供 `excerpts`（register / replace / sources / items 与 open 跳转）、`materials.actions` 的「转为卡片」、插件页里的 `window.open` 外链与 `navigator.clipboard` 写入。android / ios 的 `minAppVersion` 填首个提供这些能力的手机版本，发布前按实际版本核对。

跨端能力以[官方 API 支持矩阵](https://github.com/LastKnightCoder/tau-plugin-template/blob/main/docs/api-support.md)为准。手机与桌面使用同一插件 ID 与同一安装包，节点 type 和历史数据保持兼容。

## 验证与发布

1. 使用正式 npm 依赖与仓库锁文件执行 `pnpm install --frozen-lockfile`，不注入本地 SDK。
2. 执行 `pnpm test`，再执行 `pnpm build`。
3. 正式用户通过插件中心安装。作者客户端行为验收覆盖启用、原有功能、保存重开与停用；手机上另走一遍连接、同步、转为卡片、从摘录跳回、系统返回键与杀进程重开。构建或单测通过不等于已完成这些验收。
4. 发布时提高 package.json 与 manifest.json 版本，使用新 tag；不覆盖旧版本。推送 tag 会触发发布工作流，提交源码不等于已经上架。
