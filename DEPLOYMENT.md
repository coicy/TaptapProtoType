# GitHub Pages 部署

本项目是纯静态 Vite 站点，部署产物为 `dist/`。`settlement.html` 是唯一的可玩原型入口，根路径会自动跳转到该页面。工作流会在 `main` 分支更新或手动触发时执行：安装依赖、运行原型验收、构建入口页面，然后发布到 GitHub Pages。

## 首次配置

1. 将项目放入 GitHub 仓库，并把默认分支命名为 `main`。
2. 在仓库的 **Settings → Pages** 中，将 **Source** 设置为 **GitHub Actions**。
3. 推送到 `main`，或在 **Actions → Deploy Vite prototype to GitHub Pages → Run workflow** 手动运行。

Vite 会根据 `GITHUB_REPOSITORY` 自动设置项目站点路径。普通仓库的访问地址是：

```text
https://<账号>.github.io/<仓库名>/
https://<账号>.github.io/<仓库名>/settlement.html
```

如果仓库名是 `<账号>.github.io`，工作流会使用根路径，访问地址为：

```text
https://<账号>.github.io/
https://<账号>.github.io/settlement.html
```

## 本地预览生产构建

```text
npm ci
npm run acceptance
npm run build
npm run preview
```

`npm run preview` 默认在 `http://localhost:4173/` 提供 `dist/`。本地开发仍使用 `npm run dev`，默认地址为 `http://localhost:5173/settlement.html`。
