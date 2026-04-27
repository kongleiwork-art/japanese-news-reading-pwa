# Backend Handoff

## 当前前端状态

当前前端已经具备一套稳定的移动端 PWA 原型，页面和状态链路如下：

- 首页 `/`
- 原文频道 `/?channel=original`
- 分类筛选 `/?category=...`
- 文章详情 `/article/[id]`
- 词条详情状态 `?word=...`
- 单词本 `/words`
- 复习 `/review`
- 复习翻面状态 `?side=back`
- 我的 `/me`

## 前端当前依赖的数据结构

前端当前以本地 mock 数据驱动，核心结构在：

- `src/lib/data.ts`

主要类型：

- `Channel`
- `Category`
- `ArticlePreview`
- `ArticleDetail`
- `VocabularyItem`

## 后端下一步需要接的能力

### 1. 新闻源抓取与标准化

建议优先接：

- `NHK NEWS WEB EASY`
- `NHK NEWS WEB`

后端需要输出统一文章模型，至少包含：

- `id`
- `channel`
- `title`
- `source`
- `category`
- `summary`
- `readingMinutes`
- `publishedAt`
- `image`
- `content`

### 2. 词条结构化

前端已经按词条详情模型消费，后端最终需要能提供：

- `id`
- `surface`
- `reading`
- `romaji`
- `level`
- `partOfSpeech`
- `meanings`
- `examples`
- `aiNote`

### 3. URL 状态兼容

前端当前关键交互依赖 URL 状态：

- 文章词条：`/article/[id]?word=...`
- 单词本词条：`/words?word=...`
- 复习翻面：`/review?side=back`
- 复习词条：`/review?side=back&word=...`

后端接口设计时，不需要直接处理这些 query，但需要保证返回数据能支撑这些状态恢复。

## 推荐接口草案

### 首页列表

- `GET /api/articles?channel=easy&category=经济`

返回：

- `ArticlePreview[]`

### 文章详情

- `GET /api/articles/:id`

返回：

- `ArticleDetail`

### 单词本

- `GET /api/vocabulary/groups`

返回：

- 按文章分组的词条列表

### 单词详情

- `GET /api/vocabulary/:id`

返回：

- `VocabularyItem`

### 复习队列

- `GET /api/review/queue`

返回：

- 当前待复习词列表

### 复习结果提交

- `POST /api/review/result`

请求体建议：

- `wordId`
- `rating`
- `nextReviewAt`

## 前后端联调注意事项

- 首页任何文章卡都必须有真实详情页
- 文章详情中的可点击词必须能映射到合法词条 `id`
- 同一个词条在文章页、单词本、复习页必须使用同一数据标识
- 不要让前端自己推断词条主键或文章主键

## 当前前端交互上的关键技术决策

为了保证 in-app browser 和受限环境下的稳定性，前端已明确采用：

- `URL 驱动状态` 而非脆弱的纯本地瞬时状态

这意味着后端接口应优先提供：

- 稳定主键
- 可重放的数据结构
- 页面刷新后可恢复的详情数据

## 建议后端实现顺序

1. 先做文章列表和详情接口
2. 再做词条详情接口
3. 再做复习队列与结果提交
4. 最后补收藏、历史、用户设置持久化

## 交接文件

前端问题复盘：

- [frontend-pwa-ui-qa-retrospective.md](</C:/Users/Windows/Documents/New project/docs/frontend-pwa-ui-qa-retrospective.md>)

前端团队验收清单：

- [frontend-qa-checklist.md](</C:/Users/Windows/Documents/New project/docs/frontend-qa-checklist.md>)
