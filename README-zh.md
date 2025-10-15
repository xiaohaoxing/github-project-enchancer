# GitHub Project Filter Enhancer（基于 WXT 的浏览器扩展）

使用 WXT 框架重构，在 GitHub Projects 页面提供：一键模糊搜索与常用筛选收藏，结构模块化、易维护。

## 主要功能
- 一键模糊搜索：把当前输入转换为 `title:*关键词*`
- 收藏与管理筛选：⭐ 保存，列表选择，支持删除管理

## 安装与运行（WXT）
1. 安装依赖：`npm i`
2. 开发调试：`npm run dev`（根据指引加载开发版扩展）
3. 构建打包：`npm run build`，`npm run zip`

## 目录结构
- 入口：`entrypoints/content.ts`
- 模块：`modules/`（`filter.ts`、`storage.ts`、`ui.ts`）
- 配置：`wxt.config.ts`、`tsconfig.json`

## 文档
- 功能说明：`docs/FEATURES-zh.md`
- 本地开发与发布：`docs/DEVELOPMENT-zh.md`
- 商店上架文案：`STORE-LISTING-zh.md`
- 隐私政策：`PRIVACY-POLICY-zh.md`

## 兼容性与说明
- Chromium 浏览器（MV3）
- 仅在 `github.com` 的 Projects 页面注入
- 旧目录 `extension/` 已废弃，仅保留参考