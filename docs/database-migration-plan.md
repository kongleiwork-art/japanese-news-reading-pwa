# 日语新闻学习应用数据库改造实施计划

> 版本：1.0
> 日期：2026-05-07
> 项目：轻读日语 PWA（Qingdu Japanese）

---

## 1. 项目背景

### 1.1 当前问题

| 问题 | 原因 | 影响 |
|------|------|------|
| 页面加载慢（5-30 秒） | 跨洋网络请求 NHK 新闻源 | 用户体验差 |
| 爬虫实时执行 | 用户请求时才触发爬取 | 首次访问极慢 |
| 缓存无法持久化 | SQLite 文件在 Vercel Serverless 中临时存储 | 重启后数据丢失 |
| 收藏文章无法长期保存 | 仅存于 LocalStorage | 换设备/清缓存后丢失 |

### 1.2 改造目标

- 用户请求响应时间 < 1 秒
- 后台定时爬取，保证新闻时效性（30 分钟更新）
- 支持用户收藏文章长期保存
- Vercel 部署可用，数据持久化

---

## 2. 架构设计

### 2.1 当前架构（问题）

```
用户请求 → Next.js API Route → 实时爬取 NHK → 返回数据
                                    ↑
                              跨洋请求，5-30 秒
```

### 2.2 改造后架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (前端)                           │
│  Next.js 16 + React 19 + Tailwind CSS 4 + PWA             │
│  用户学习状态：LocalStorage（单词本、复习进度）              │
└─────────────────────────┬─────────────────────────────────┘
                          │ API 请求 (< 100ms)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     Turso 数据库                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ daily_articles│  │saved_articles │  │article_content │   │
│  │ 每日精选     │  │ 用户收藏     │  │ 文章详情       │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↑
                 GitHub Actions (每 30 分钟)
                          ↓
              ┌─────────────────────────┐
              │ 爬取 50-100 篇新闻      │
              │ 筛选 12 篇精选          │
              │ 预分词 + 词汇匹配       │
              │ 保存到 Turso            │
              └─────────────────────────┘
```

### 2.3 数据流向

```
每日精选文章流程：
  NHK 新闻源 → GitHub Actions → 筛选处理 → Turso 数据库
                                              ↓
                    用户请求 ← API Route ← 毫秒级读取

用户收藏流程：
  用户点击收藏 → 保存到 Turso → 长期持久化

用户学习数据流程（不变）：
  保存单词 / 复习评分 → LocalStorage → 本地持久化
```

### 2.4 数据分层存储策略

| 数据类型 | 存储方式 | 原因 |
|----------|----------|------|
| 每日精选文章 | Turso 数据库 | 定时更新、需要持久化 |
| 用户收藏文章 | Turso 数据库 | 用户私有数据、长期保存 |
| 文章详细内容 | Turso 数据库 | 收藏后阅读、预分词结果 |
| 用户学习状态 | LocalStorage | 已有实现、无需跨设备 |
| 词库（~500 词） | 静态代码 | 轻量、读多写少、无需更新 |

---

## 3. 数据库设计

### 3.1 Turso 选型理由

| 对比项 | Turso | Neon | Supabase |
|--------|-------|------|----------|
| 免费存储 | 5 GB | 0.5 GB | 500 MB |
| 免费读取 | 5 亿行/月 | 有限 | 有限 |
| 边缘部署 | ✅ 300+ 节点 | ❌ | ❌ |
| 冷启动 | 无 | ~500ms | ~10-30s |
| 与 SQLite 兼容 | ✅ 100% | ❌ | ❌ |
| 付费起步 | $4.99/月 | $19/月 | $25/月 |

选择 Turso 的核心原因：
1. 项目已使用 SQLite（`node:sqlite`），迁移成本最低
2. 免费额度最大，长期使用无忧
3. 边缘部署，用户访问速度快

### 3.2 表结构设计

```sql
-- 每日精选文章表
CREATE TABLE IF NOT EXISTS daily_articles (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,              -- 'easy' | 'original'
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  source TEXT,
  published_at TEXT,
  image_type TEXT,                    -- 'gradient' | 'remote'
  image_value TEXT,
  image_alt TEXT,
  reading_minutes INTEGER,
  difficulty_level TEXT,              -- 'easy' | 'medium' | 'hard'
  vocabulary_ids TEXT,                -- JSON 数组，预匹配的词汇 ID
  vocabulary_data TEXT,               -- JSON 数组，预匹配的词汇详情
  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_channel ON daily_articles(channel);
CREATE INDEX IF NOT EXISTS idx_daily_published ON daily_articles(published_at);

-- 文章详细内容表（收藏时保存完整内容）
CREATE TABLE IF NOT EXISTS article_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  content TEXT,                       -- 文章正文（段落数组 JSON）
  source TEXT,
  category TEXT,
  published_at TEXT,
  image_type TEXT,
  image_value TEXT,
  image_alt TEXT,
  vocabulary_ids TEXT,                -- 预分词结果
  vocabulary_data TEXT,               -- 词汇详情
  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 用户收藏文章表
CREATE TABLE IF NOT EXISTS user_saved_articles (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  category TEXT,
  image_type TEXT,
  image_value TEXT,
  image_alt TEXT,
  reading_minutes INTEGER,
  saved_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_saved_at ON user_saved_articles(saved_at);
```

### 3.3 字段说明

#### daily_articles

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 文章唯一 ID（如 `ne1234`、`na-k1234`） |
| channel | TEXT | 频道：`easy`（简单日语）或 `original`（实时新闻） |
| title | TEXT | 文章标题 |
| summary | TEXT | 文章摘要 |
| category | TEXT | 分类（政治、经济、科技等） |
| source | TEXT | 来源（NHK EASY / NHK NEWS WEB） |
| published_at | TEXT | 发布时间（ISO 格式） |
| image_type | TEXT | 图片类型：`gradient`（渐变）或 `remote`（远程） |
| image_value | TEXT | 图片值（URL 或渐变样式） |
| image_alt | TEXT | 图片替代文本 |
| reading_minutes | INTEGER | 预估阅读时间（分钟） |
| difficulty_level | TEXT | 难度等级：`easy` / `medium` / `hard` |
| vocabulary_ids | TEXT | 预匹配的词汇 ID 列表（JSON 数组） |
| vocabulary_data | TEXT | 预匹配的词汇详情（JSON 数组） |
| fetched_at | TEXT | 爬取时间 |

#### article_content

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 文章唯一 ID |
| content | TEXT | 文章正文（段落字符串数组 JSON） |
| 其余字段 | - | 同 daily_articles |

#### user_saved_articles

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 收藏记录唯一 ID |
| article_id | TEXT | 关联的文章 ID |
| saved_at | TEXT | 收藏时间 |
| 其余字段 | - | 文章元数据快照 |

---

## 4. 实施步骤

### 阶段 1：准备工作（不涉及代码）

| 编号 | 任务 | 说明 |
|------|------|------|
| 1.1 | 注册 Turso 账号 | 访问 [turso.tech](https://turso.tech)，无需信用卡 |
| 1.2 | 创建数据库 | 命名为 `qingdu-news` |
| 1.3 | 获取连接信息 | `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` |
| 1.4 | 配置 Vercel 环境变量 | 在 Vercel 项目设置中添加上述变量 |
| 1.5 | 配置 GitHub Secrets | 在 GitHub 仓库设置中添加上述变量 |

### 阶段 2：安装依赖

```bash
npm install @libsql/client
```

### 阶段 3：创建 Turso 客户端模块

**新建文件：** `src/lib/db/client.ts`

- 创建 Turso 数据库连接
- 支持环境变量配置
- 单例模式，避免重复连接

### 阶段 4：创建数据库初始化脚本

**新建文件：** `scripts/init-db.ts`

- 执行建表 SQL
- 创建索引
- 支持重复执行（`IF NOT EXISTS`）

### 阶段 5：创建数据访问层

**新建文件：** `src/lib/db/articles.ts`

- `getDailyArticles()` - 获取每日精选文章
- `saveDailyArticles()` - 保存每日精选文章

**新建文件：** `src/lib/db/saved-articles.ts`

- `getSavedArticles()` - 获取收藏文章列表
- `saveArticle()` - 收藏文章
- `removeSavedArticle()` - 取消收藏
- `getArticleContent()` - 获取文章详情
- `saveArticleContent()` - 保存文章详情

### 阶段 6：创建爬虫脚本

**新建文件：** `scripts/crawl-and-save.ts`

核心流程：

```
1. 爬取 NHK EASY 和 NHK NEWS WEB 原始文章（各 50-100 篇）
2. 质量筛选（可读性、长度、词汇难度）
3. 精选每频道 12 篇
4. 预分词 + 词汇匹配
5. 计算难度等级
6. 保存到 Turso 数据库
```

难度计算规则：

```typescript
function calculateDifficulty(article): 'easy' | 'medium' | 'hard' {
  const vocabulary = matchVocabulary(article.text, limit: 20);

  if (n1Count > 5 || n2Count > 10) return 'hard';
  if (n3Count > 8) return 'medium';
  return 'easy';
}
```

### 阶段 7：修改 API Routes

**修改文件：** `src/app/api/articles/route.ts`

- 改为从 Turso 读取，移除实时爬取逻辑
- 保持 API 接口不变（`channel`、`category` 参数）

**修改文件：** `src/app/api/articles/[id]/route.ts`

- 改为从 Turso 读取文章详情
- 优先从 `article_content` 表读取

### 阶段 8：修改前端收藏功能

**修改文件：** `src/lib/learning-store.ts`

- 收藏文章时同步写入 Turso
- 取消收藏时同步删除 Turso 记录
- 保留 LocalStorage 作为本地缓存

**修改文件：** `src/components/saved-articles-screen.tsx`

- 从 Turso 读取收藏列表
- 支持离线查看（LocalStorage 缓存）

### 阶段 9：配置 GitHub Actions

**新建文件：** `.github/workflows/crawl.yml`

```yaml
name: Crawl and Save News

on:
  schedule:
    - cron: '*/30 * * * *'    # 每 30 分钟执行
  workflow_dispatch:           # 允许手动触发

jobs:
  crawl:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Initialize database
        run: npx tsx scripts/init-db.ts
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}

      - name: Crawl and save articles
        run: npx tsx scripts/crawl-and-save.ts
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
```

### 阶段 10：清理旧代码

| 操作 | 文件 | 说明 |
|------|------|------|
| 删除 | `src/lib/articles/cache.ts` | 移除旧 SQLite 缓存 |
| 简化 | `src/lib/articles/sources.ts` | 仅保留爬虫工具函数 |
| 简化 | `src/lib/articles/pipeline.ts` | 移除内存缓存和实时爬取逻辑 |

### 阶段 11：测试和部署

| 编号 | 任务 | 说明 |
|------|------|------|
| 11.1 | 本地测试 | `npm run dev`，验证数据读取正常 |
| 11.2 | 运行测试 | `npm run test`，确保所有测试通过 |
| 11.3 | Lint 检查 | `npm run lint`，确保代码规范 |
| 11.4 | 构建测试 | `npm run build`，确保构建成功 |
| 11.5 | 配置 Vercel 环境变量 | 添加 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` |
| 11.6 | 部署到 Vercel | `vercel deploy` |
| 11.7 | 手动触发 GitHub Actions | 首次填充数据 |
| 11.8 | 验证功能 | 检查文章列表、收藏功能、复习功能 |

---

## 5. 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | `src/lib/db/client.ts` | Turso 数据库客户端 |
| 新增 | `src/lib/db/articles.ts` | 每日文章数据访问层 |
| 新增 | `src/lib/db/saved-articles.ts` | 收藏文章数据访问层 |
| 新增 | `scripts/init-db.ts` | 数据库初始化脚本 |
| 新增 | `scripts/crawl-and-save.ts` | 爬虫脚本 |
| 新增 | `.github/workflows/crawl.yml` | GitHub Actions 定时任务 |
| 修改 | `src/app/api/articles/route.ts` | 改为从 Turso 读取 |
| 修改 | `src/app/api/articles/[id]/route.ts` | 改为从 Turso 读取 |
| 修改 | `src/lib/learning-store.ts` | 收藏功能对接 Turso |
| 修改 | `src/components/saved-articles-screen.tsx` | 从 Turso 读取收藏 |
| 修改 | `package.json` | 添加 `@libsql/client` 依赖 |
| 删除 | `src/lib/articles/cache.ts` | 移除旧 SQLite 缓存 |
| 简化 | `src/lib/articles/sources.ts` | 仅保留爬虫工具函数 |
| 简化 | `src/lib/articles/pipeline.ts` | 移除实时爬取逻辑 |

---

## 6. 环境变量

```env
# Turso 数据库配置（必须）
TURSO_DATABASE_URL=libsql://qingdu-news-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

# 可选：本地开发时仍可用 SQLite
ARTICLES_SQLITE_CACHE_PATH=.cache/articles.sqlite
```

---

## 7. 验收标准

### 7.1 性能指标

| 指标 | 改造前 | 改造后目标 |
|------|--------|------------|
| 首页加载时间 | 5-30 秒 | < 1 秒 |
| 文章详情加载 | 3-15 秒 | < 500ms |
| 收藏文章加载 | 即时（LocalStorage） | < 200ms |

### 7.2 功能验收

- [ ] 文章列表正常显示（简单日语 + 实时新闻）
- [ ] 频道切换和分类筛选正常
- [ ] 文章详情页正常（正文、词汇高亮、词汇卡片）
- [ ] 收藏文章功能正常（保存、查看、删除）
- [ ] 复习功能正常
- [ ] 单词本功能正常
- [ ] 我的页面统计数据正常
- [ ] GitHub Actions 定时任务正常运行
- [ ] Vercel 部署成功

### 7.3 代码质量

- [ ] 所有测试通过（`npm run test`）
- [ ] Lint 检查通过（`npm run lint`）
- [ ] 构建成功（`npm run build`）
- [ ] TypeScript 类型检查通过

---

## 8. 风险和应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| Turso 免费额度不足 | 低 | 中 | 监控用量，必要时升级（$4.99/月） |
| GitHub Actions 执行失败 | 中 | 低 | 添加错误通知，保留旧数据兜底 |
| NHK API 变更 | 低 | 高 | 保留旧数据，手动修复爬虫 |
| 迁移期间服务中断 | 低 | 中 | 分步迁移，保留回退能力 |

---

## 9. 未来扩展建议

| 优先级 | 功能 | 说明 |
|--------|------|------|
| 高 | 多设备同步 | 为 `user_saved_articles` 添加 `user_id` 字段 |
| 高 | 用户学习数据云端化 | 将 LocalStorage 数据迁移到 Turso |
| 中 | 文章搜索功能 | 利用 Turso 的全文搜索能力 |
| 中 | 阅读历史统计 | 在 Turso 中记录用户阅读行为 |
| 低 | 用户贡献词汇 | 允许用户提交新词汇到词库 |
| 低 | 个性化推荐 | 根据用户水平推荐文章难度 |

---

## 10. 参考资料

- [Turso 官方文档](https://docs.turso.tech)
- [Turso Vercel 集成](https://vercel.com/marketplace/tursocloud)
- [@libsql/client API](https://docs.turso.tech/sdk/ts/quickstart)
- [GitHub Actions 定时任务](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
