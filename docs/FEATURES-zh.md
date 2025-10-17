# 项目功能说明（GitHub Project Filter Enhancer）

本扩展旨在提升 GitHub Projects 页面筛选效率，核心能力包括：

## 一键模糊搜索
- 背景：GitHub Projects 的搜索默认是前缀匹配，难以快速定位包含关键词的卡片标题。
- 做法：在筛选输入框内部添加“模糊”按钮，一键将当前输入转换为 `title:*关键词*`，并自动触发筛选。

## 常用筛选收藏与管理
- ⭐ 保存：将当前筛选条件保存为常用项，并自定义名称。
- 下拉快速应用：从输入框上方的下拉菜单中选择已保存项，立即应用筛选。
- 管理：从下拉菜单选择“🗑️ 管理筛选条件”，以列表查看、按序号删除指定项。

## 快捷筛选行（新增）
- 位置：显示在 GitHub Projects 的筛选输入框上方，与收藏下拉与保存按钮同一行。
- 可配置项：
  - 标题包含：映射为 `title:*关键词*`
  - assignee：映射为 `assignee:xxx`
  - label：映射为 `label:xxx`
  - status：映射为 `status:xxx`
  - iteration：映射为 `iteration:xxx`
  - is：`open/closed`（为空则不设置）
- 双向同步：
  - 修改控件会实时更新并应用搜索框内容。
  - 编辑搜索框时，控件会自动反映当前查询（仅同步上述已支持 token）。

## 数据与权限
- 数据存储：仅使用 `chrome.storage.local` 在本地保存收藏的筛选条件，不进行云端同步与上传。
- 所需权限：`storage` + `github.com` 站点注入权限。

## 兼容说明
- 适配 GitHub Projects（含组织与仓库维度的 Projects 页面）。
- 如 GitHub 改版导致 DOM 结构变更，扩展会尝试自愈（基于 MutationObserver），必要时请提交 Issue 以跟进适配。

## 已知限制
- 仅支持卡片标题模糊匹配（`title:*...*`），不覆盖全部 Projects 查询语法。
- 收藏数据存于本地设备，切换浏览器或设备不会自动迁移。
