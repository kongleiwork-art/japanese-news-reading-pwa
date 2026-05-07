# 计划：提交 v1.2 分支并合并到 main 推送到 GitHub

## 摘要

将当前 `v1.2-news-content-persistence` 分支上的所有未提交更改提交，然后本地合并到 `main` 分支，推送到 GitHub 远程仓库。推送后 GitHub Actions 会自动触发腾讯云部署。

## 当前状态分析

- **当前分支**: `v1.2-news-content-persistence`
- **当前 commit**: `a1146f9` (与 main 和 origin/main 相同)
- **远程仓库**: `https://github.com/kongleiwork-art/japanese-news-reading-pwa.git`
- **Git 路径**: `D:\Git\cmd\git.exe`（不在系统 PATH 中）
- **Git 用户**: `kongleiwork-art <kongleiwork@gmail.com>`

### 未提交的更改（13 个已修改文件 + 8 个新文件）

**已修改文件：**
1. `package-lock.json` — 依赖更新
2. `package.json` — 依赖/脚本更新
3. `src/app/api/articles/route.ts`
4. `src/app/page.tsx`
5. `src/components/article-screen.tsx`
6. `src/components/home-screen.tsx`
7. `src/lib/articles/config.ts`
8. `src/lib/articles/dictionary.ts`
9. `src/lib/articles/pipeline.ts`
10. `src/lib/articles/sources.ts`
11. `src/lib/articles/vocabulary.ts`
12. `tests/articles-dictionary-coverage.test.mjs`
13. `tests/articles-tokenizer.test.mjs`

**新增文件：**
1. `.github/workflows/crawl.yml` — 定时爬虫工作流
2. `scripts/crawl-and-save.ts` — 爬虫脚本
3. `scripts/init-db.ts` — 数据库初始化脚本
4. `src/app/error.tsx` — 错误页面
5. `src/lib/articles/news-core-dictionary.ts` — 新闻核心词典
6. `src/lib/articles/selection.ts` — 文章选择逻辑
7. `src/lib/db/` — 数据库模块（schema、client、articles）
8. `tests/articles-selection.test.mjs` — 选择逻辑测试

### CI/CD 注意事项

- 推送到 `main` 分支会触发 `deploy-tencent-cloud.yml` 工作流
- 该工作流会：构建项目 → SSH 部署到腾讯云 → pm2 重启
- 需确保代码能正常构建，否则部署会失败

## 执行步骤

### 步骤 1：在 v1.2 分支上提交所有更改

```bash
git add -A
git commit -m "Release v1.2 news content persistence"
```

- 使用 `git add -A` 暂存所有更改（包括新文件和修改文件）
- 提交信息遵循项目现有风格（如 "Release v1.1 learning loop"）

### 步骤 2：切换到 main 分支

```bash
git checkout main
```

### 步骤 3：合并 v1.2 分支到 main

```bash
git merge v1.2-news-content-persistence
```

- 由于 v1.2 分支是从 main 的同一 commit 分出的，这将是 fast-forward 合并
- 不会产生额外的 merge commit

### 步骤 4：推送 main 到 GitHub

```bash
git push origin main
```

- ⚠️ 此操作会自动触发腾讯云部署
- 确保 GitHub 远程仓库的认证凭据可用

### 步骤 5：推送 v1.2 分支到 GitHub（可选）

```bash
git push -u origin v1.2-news-content-persistence
```

- 将 v1.2 分支也推送到远程，便于备份和追踪
- 设置上游跟踪分支

## 假设与决策

1. **假设 Git 认证可用** — 推送到 GitHub 时不需要额外输入密码（可能已配置 credential manager 或 SSH key）
2. **假设无冲突** — v1.2 分支基于 main 的最新 commit，不会有合并冲突
3. **决策：跳过本地构建验证** — 用户选择直接提交推送，由 GitHub Actions CI 自动验证
4. **决策：本地合并而非 PR** — 用户选择本地合并后推送

## 验证步骤

1. 确认 `git status` 在提交后为 clean 状态
2. 确认 `git log` 显示新的 commit
3. 确认 `git push` 成功推送到远程
4. 可选：在 GitHub 上检查 Actions 工作流是否正常触发和运行
