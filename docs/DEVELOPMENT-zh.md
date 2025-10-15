# 本地开发与发布指引（WXT）

## 快速开始
1. 安装依赖：`npm i`
2. 启动开发：`npm run dev`
   - 按 WXT 终端提示，在浏览器中加载开发版扩展
3. 构建打包：`npm run build`，`npm run zip`

## 目录结构
```
entrypoints/
  └─ content.ts        # 内容脚本入口
modules/
  ├─ filter.ts         # 查询转换与注入
  ├─ storage.ts        # 本地存储抽象（chrome.storage.local）
  └─ ui.ts             # DOM 操作与 UI 组装
wxt.config.ts          # WXT 配置（生成 MV3 manifest）
tsconfig.json          # TS 配置
```

## 调试技巧
- 代码更新后 WXT 会自动重载，或按终端指引在扩展管理页刷新
- 在 GitHub Projects 页面打开 DevTools 观察日志与 DOM 结构

## 发布到商店
1. 执行 `npm run build` 生成打包产物
2. 执行 `npm run zip` 生成 zip 包
3. 前往商店后台上传 zip 并填写：
   - 名称、图标（16/48/128）、至少 2 张截图
   - 扩展描述：见 `STORE-LISTING-zh.md`
   - 隐私政策：见 `PRIVACY-POLICY-zh.md`

## 兼容性备注
- 需 Manifest V3 支持的 Chromium 浏览器
- 注入范围：`github.com` 的 Projects 页面

## 迁移说明
- 旧目录 `extension/` 已废弃，仅作参考；新代码基于 WXT 的入口与模块化组织
