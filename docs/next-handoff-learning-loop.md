# 下一阶段交接计划：学习闭环真实化

日期：2026-04-29

## 1. 当前状态

内容管线已经达到“本地演示稳定”：

- `easy` 频道：NHK EASY，已接入匿名授权 cookie 流程，可抓取完整 classic HTML 正文。
- `original` 频道：TBS NEWS DIG，保留实时新闻源。
- 公开文章接口保持稳定：
  - `GET /api/articles?channel=easy|original&category=...`
  - `GET /api/articles/[id]`
- 内容管线已拆分到 `src/lib/articles/`：
  - `types.ts`：公开类型与文章模型
  - `config.ts`：源地址、TTL、分类关键词
  - `parsers.ts`：NHK/TBS HTML 解析
  - `sources.ts`：源抓取与 NHK cookie 缓存
  - `pipeline.ts`：内存缓存、降级、健康状态、对外查询
  - `vocabulary.ts`：当前内置词汇数据
- 新增开发调试接口：
  - `GET /api/articles/health`
  - 仅开发环境可用，生产环境返回 404。

最近验证通过：

```powershell
npm.cmd run test:parsers
npm.cmd run lint
npm.cmd run build
npm.cmd run test:content
```

当前稳定性边界：

- 目标是 `localhost:3100` 本地演示稳定。
- 缓存是 Node 进程内存缓存，服务重启后会重新抓取。
- 还没有数据库、用户账号、线上监控或长期内容持久化。

## 2. 下一阶段目标

下一阶段建议推进“学习闭环真实化”。

核心目标：让用户在一篇新闻里完成最小学习闭环：

1. 打开文章
2. 阅读正文
3. 点开生词
4. 保存单词或文章
5. 形成阅读历史
6. 在复习页看到可复习内容

这一阶段不要急着引入数据库。建议先用浏览器本地持久化实现 MVP，让刷新页面不丢状态，并为后续服务端 API 保留清晰的数据形状。

## 3. 推荐实施顺序

### 3.1 本地学习状态层

新增一个客户端学习状态模块，建议路径：

```text
src/lib/learning-store.ts
```

职责：

- 读取和写入 `localStorage`
- 管理收藏文章
- 管理保存单词
- 管理阅读历史
- 生成复习队列

建议 localStorage key：

```ts
const STORAGE_KEY = "qingdu-learning-state-v1";
```

建议数据结构：

```ts
type LearningState = {
  savedArticleIds: string[];
  savedWords: SavedWord[];
  readHistory: ReadHistoryItem[];
  reviewRecords: ReviewRecord[];
};

type SavedWord = {
  id: string;
  articleId: string;
  surface: string;
  reading: string;
  meanings: string[];
  savedAt: string;
  reviewCount: number;
  nextReviewAt: string;
};

type ReadHistoryItem = {
  articleId: string;
  channel: "easy" | "original";
  title: string;
  source: string;
  readAt: string;
};

type ReviewRecord = {
  wordId: string;
  rating: "again" | "hard" | "good" | "easy";
  reviewedAt: string;
  nextReviewAt: string;
};
```

### 3.2 文章详情页接入保存行为

目标页面：

```text
src/components/article-screen.tsx
```

建议改动：

- “收藏文章”按钮从静态按钮变成真实 toggle。
- 点击词汇卡片或词汇弹层时，提供“保存单词”动作。
- 进入文章详情时记录阅读历史。
- 已保存的文章和单词在 UI 上显示已保存状态。

注意：

- `article-screen.tsx` 当前是服务端传入 article，再渲染交互组件。
- 如果加入 `localStorage`，需要把保存按钮或学习动作拆成 client component。
- 不建议把整个详情页都变成 client component，可以只拆局部组件。

### 3.3 单词本页面从 mock 迁移

目标页面：

```text
src/components/words-screen.tsx
```

目标：

- 从 localStorage 读取 `savedWords`。
- 按文章或保存时间分组展示。
- 保持现有词汇弹层体验。
- 没有保存单词时显示空状态，引导用户去首页阅读文章。

验收标准：

- 在文章页保存一个词，进入 `/words` 能看到。
- 刷新页面后保存状态仍存在。
- 点击词条能打开详情。

### 3.4 复习页从 mock 迁移

目标页面：

```text
src/components/review-screen.tsx
```

目标：

- 从 `savedWords` 生成复习队列。
- 默认展示 `nextReviewAt <= now` 的词。
- 如果没有到期词，展示最近保存的词作为轻量复习。
- 提交复习结果后更新 `reviewCount` 和 `nextReviewAt`。

建议间隔：

```ts
again: 10 minutes
hard: 1 day
good: 3 days
easy: 7 days
```

验收标准：

- 保存单词后 `/review` 有内容。
- 点击评分后队列变化。
- 刷新页面后复习记录仍存在。

### 3.5 我的页面统计真实化

目标页面：

```text
src/components/me-screen.tsx
```

目标：

- 展示已读文章数
- 展示收藏文章数
- 展示保存单词数
- 展示今日复习数

这一块可以最后做，因为它依赖前面状态已经写入。

## 4. 暂不做的内容

本阶段不建议做：

- 用户登录
- PostgreSQL / Prisma
- 服务端收藏 API
- 多设备同步
- AI 释义生成
- 后台定时抓取入库

原因：现在最重要的是验证“用户是否真的愿意围绕新闻保存和复习”，先把本地闭环做快、做顺。

## 5. 后续服务端迁移预留

虽然本阶段先用 localStorage，但建议命名和数据结构保持接近未来 API：

未来接口可以长这样：

```text
GET    /api/me/learning-state
POST   /api/articles/[id]/save
DELETE /api/articles/[id]/save
POST   /api/vocabulary/save
DELETE /api/vocabulary/[id]/save
POST   /api/articles/[id]/read
GET    /api/review/queue
POST   /api/review/result
```

未来迁移策略：

1. 保留前端 `learning-store` 的调用接口。
2. 把内部实现从 localStorage 换成 fetch API。
3. 增加用户登录后再做多设备同步。

## 6. 验收清单

完成下一阶段后，应能验证：

- 首页文章列表仍正常加载。
- 文章详情页仍正常打开。
- 用户可以收藏文章。
- 用户可以保存文章里的词。
- `/words` 能展示真实保存词。
- `/review` 能根据保存词生成复习队列。
- `/me` 的统计来自真实本地状态。
- 刷新页面后收藏、保存、历史、复习状态不丢。
- `npm.cmd run lint` 通过。
- `npm.cmd run build` 通过。

建议新增轻量测试或脚本：

```text
scripts/learning-state-smoke.mjs
```

至少验证：

- 初始状态可解析
- 保存文章去重
- 保存单词去重
- 阅读历史按时间更新
- 复习评分能更新 `nextReviewAt`

## 7. 推荐下一步任务

下一位接手者可以直接从这个任务开始：

> 实现 `src/lib/learning-store.ts`，并把文章详情页的“收藏文章”和“保存单词”接入 localStorage。

完成后再推进：

1. `/words` 接真实保存词。
2. `/review` 接真实复习队列。
3. `/me` 接真实统计。

这条路线风险最低，能最快把产品从“新闻阅读 demo”推进到“有学习闭环的可试用 PWA”。
