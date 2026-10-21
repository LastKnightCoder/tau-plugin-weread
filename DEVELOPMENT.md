# 微信读书插件开发与维护

## 自动发布

本仓库的.github/workflows/release.yml与公开模板一致。同步更新package.json和manifest.json版本并提交后，推送对应版本tag即可自动安装依赖、运行测试（若定义）、构建并将ZIP上传到GitHub Release，无需手动上传或配置额外Token。

```sh
version=$(node -p "require('./manifest.json').version")
git tag "v$version"
git push origin HEAD
git push origin "v$version"
```

tag也可不带v前缀，版本必须与两个文件一致；预发布版本自动标记为Pre-release。Actions失败可重跑，已有Release会更新同名ZIP。已发布版本不要移动tag，代码修复应提高版本再发布。仓库需启用Actions并允许contents:write。Git远程统一使用SSH；该流程不自动提交插件中心审核或更新客户端固定产物。

插件 ID `weread`。连接微信读书官方 API Key，读取书架，查看划线与想法，并把它们同步为 Tau 摘录（可搜索、引用、转卡片 / 问题）。只依赖公开 SDK（`@tau/plugins`、`@tau/ui`），构建脚本拒绝打包仓库内部源码。

## 数据

1.0.2、1.0.3 只更新 README 与 CHANGELOG，功能与数据口径不变。

1.0.1 修复同步失败误下架与迁移后离线定位：下架只依据完整远端成员清单，不依据补拉成功列表；没有私有书架缓存时，从正式摘录来源恢复书名、划线和定位。分页不完整或游标停滞时中止同步，不把部分结果视为全集。材料动作的跨工作区修复在本次客户端源码中，需同时更新客户端构建。

- 划线与想法的事实源是 Tau 摘录：同步按书调用 `context.excerpts.replace`，书从账号消失即整本软删除，回来时原样复位、引用不变。
- `externalId` 为 `bookId:bookmarkId` / `bookId:review:reviewId`，引文规范化与「同 range 想法并入划线」的口径与插件化之前一致（`src/excerpts.ts`，`tests/excerpts.test.ts` 守护）。改动会让旧摘录被软删除、引用失效。
- 插件私有存储（按工作区）：`apiKey`、`shelf`（书籍元数据与同步指纹）、`prefs`（书架排布、排序、目录开合）。整书书评与无原文的章节想法不进摘录，只在已连接时从网关读取展示。

## 开发

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build        # dist/weread-<版本>.zip
pnpm install:local # 解压到 ~/.editor/plugins/weread，目标已存在时拒绝
```

使用 Node.js 24、pnpm 11.9.0。依赖公开 npm SDK 0.8.0，语义工具类从 @tau/plugins/tailwind.css 编译，不需要主项目源码。需要 Tau 0.59.0 及以上，在插件管理中选择「安装或更新 ZIP」。

类名一律带 `wr:` 前缀（如 `wr:flex wr:md:hidden`）：插件样式和 Tau 的样式在同一页面里，不带前缀的工具类会排在宿主的响应式写法之后把它们覆盖掉。开启前缀后，不带前缀的类不会生成样式；构建产物里出现不带前缀的类选择器会直接报错。

源码仓库：https://github.com/LastKnightCoder/tau-plugin-weread 。发布时同时更新 package.json、manifest.json、CHANGELOG.md，再提交并推送版本标签，由上述工作流生成 Release 和 ZIP。
