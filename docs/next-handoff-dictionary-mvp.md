# 下一步交接计划：本地词库 MVP 接入

日期：2026-04-29

## 1. 背景与当前问题

当前学习闭环已经基本可跑：

- 文章详情页可以点击正文划线词打开词条弹层。
- 词条可以保存 / 取消保存到本地单词本。
- `/words`、`/review`、`/me` 已经读取本地学习状态。
- 文章弹层关闭时已经通过 `scroll={false}` 保持阅读位置。

但词汇质量仍是瓶颈：

- 当前 `src/lib/articles/vocabulary.ts` 只有少量内置词条。
- 为了让页面有可点词，系统会从正文自动生成 `auto-*` 候选词。
- 自动候选词只有占位读音 `読解メモ` 和占位释义，保存到单词本后的复习价值不高。

下一步建议优先做“本地词库 MVP”，把当前“自动候选词 + 占位释义”升级为“只高亮真实词库词条”。

## 2. 目标

实现一个项目内本地词库，让正文高亮、词条弹层、保存单词、复习内容都基于可信词条。

成功标准：

- 正文只高亮词库中真实存在的词条。
- 点击划线词后，弹层展示真实读音、词性、中文释义、例句和说明。
- 保存词后 `/words` 可见，再次取消保存后 `/words` 移除。
- 不再生成或展示 `auto-*` 占位词条。
- 单篇文章最多展示 12 个词条，并按正文首次出现顺序排序。

## 3. 实施方案

### 3.1 新增本地词库模块

建议新增：

```text
src/lib/articles/dictionary.ts
```

职责：

- 定义并导出本地词库数据。
- 提供稳定的词条 ID、表记、别名、读音、罗马音、等级、词性、中文释义、例句和说明。
- 不接外部 API、不接数据库、不引入大型第三方词典依赖。

建议类型：

```ts
export type DictionaryEntry = {
  id: string;
  surface: string;
  aliases?: string[];
  reading: string;
  romaji: string;
  level: "N1" | "N2" | "N3" | "N4";
  partOfSpeech: string;
  meanings: string[];
  examples: {
    japanese: string;
    kana: string;
    chinese: string;
  }[];
  aiNote: string;
};
```

实现时可以让 `DictionaryEntry` 与现有 `VocabularyItem` 保持字段兼容，避免大范围改组件。

### 3.2 初始词库范围

保留现有 5 个词条：

- `technique` / `技術`
- `ai` / `AI`
- `growth` / `成長`
- `environment` / `環境`
- `society` / `社会`

补充新闻常见词，优先覆盖当前 NHK EASY / TBS 抓取文章中常见主题。建议第一批加入：

- 火事、消防、避難、地震、被害、雨、展示、国連、会議、選手、理由、写真、子ども、地域、政府、政策、経済、投資、観光、研究、教育、医療、制度、改革

每个词条至少包含：

- `surface`
- `reading`
- `romaji`
- `partOfSpeech`
- 1-2 个中文释义
- 1 个例句
- 简短 `aiNote`

### 3.3 调整词汇识别逻辑

保留当前 `src/lib/articles/tokenizer.ts` 的方向：

- 使用最长匹配。
- 支持 `aliases`。
- ASCII 词条大小写不敏感。

修改 `chooseVocabularyItems`：

- 只返回词库真实命中的词条。
- 停用当前 `inferVocabularyItems` / `auto-*` 候选词作为可点击词条的行为。
- 按词条在正文中的首次出现位置排序。
- 去重后最多返回 12 个。

建议保留但不调用自动候选逻辑，或直接删除，二选一即可。更推荐删除，避免后续误用。

### 3.4 调整文章详情 UI

目标页面：

```text
src/components/article-screen.tsx
```

要求：

- 正文只给真实词库词条加划线可点击样式。
- “识别词汇”区域只展示真实词条。
- 如果文章没有词库命中，显示轻量空状态：

```text
本篇暂未识别到词库词条
```

- 保留现有交互：
  - 点击划线词打开弹层。
  - 词条可保存 / 取消保存。
  - 保存后 `/words` 可见。
  - 关闭弹层后保持当前阅读位置。

### 3.5 接口兼容

暂时不要重命名这些字段：

- `ArticleDetail.savedWords`
- `NormalizedArticle.savedWords`
- 本地学习状态中的 `savedWords`

虽然命名不够精确，但当前前端已有多处依赖。为了降低改动风险，本阶段继续把 `savedWords` 理解为“文章识别词条 / 已保存词条”的兼容字段，后续再统一重命名。

## 4. 测试计划

### 单元测试

更新或新增：

```text
tests/articles-tokenizer.test.mjs
```

必须覆盖：

- alias 命中：`人工知能` 命中 `AI`。
- 最长匹配优先：`経済成長` 优先于 `成長`。
- 未命中词不再生成 `auto-*` 词条。
- 单篇文章词条按正文首次出现顺序输出。
- 单篇文章最多返回 12 个词条。

### 本地学习状态测试

继续运行：

```powershell
npm.cmd run test:learning
```

确保：

- 保存词写入 `localStorage`。
- 再次点击取消保存后从本地状态移除。
- `/review` 队列仍能基于保存词生成。

### 验收命令

完成后至少运行：

```powershell
npm.cmd run test
npm.cmd run test:learning
npm.cmd run lint
npm.cmd run build
```

如本地 `localhost:3100` 服务可用，再运行：

```powershell
npm.cmd run test:content
```

### 浏览器验收

在 in-app browser 手动验收：

1. 打开首页 `/`，文章列表正常加载。
2. 进入一篇文章。
3. 正文只出现真实词库划线词。
4. 点击划线词，弹层展示真实读音和中文释义。
5. 点击收藏按钮，进入 `/words` 可见。
6. 回到文章弹层，再次点击收藏按钮，进入 `/words` 已移除。
7. 在文章中部点击词，关闭弹层后仍停留在当前阅读位置。

## 5. 明确不做

本阶段不做：

- JMdict / Kuromoji / MeCab 完整接入。
- 在线词典 API。
- 数据库或服务端词库管理。
- 用户登录、多设备同步。
- AI 动态生成释义。

## 6. 下一步任务一句话

把 `src/lib/articles/vocabulary.ts` 中的少量词条和 `auto-*` 候选逻辑，升级为 `src/lib/articles/dictionary.ts` 驱动的本地真实词库，并让正文只高亮真实词条。
