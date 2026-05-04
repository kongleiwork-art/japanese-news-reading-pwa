# 下一阶段交接计划：本地词库覆盖率与补全生产线

日期：2026-04-30

## 1. 当前状态

当前阅读与学习闭环已经回到稳定的“本地精选词库为主”路线：

- 文章页正文只高亮本地词库中的真实词条。
- 词条弹层、保存单词、`/words`、`/review` 都基于可信本地词条。
- `auto-*` 占位词条已经停用。
- Jisho 实时词条不再进入主阅读链路，避免首屏变慢、英文释义外露、例句质量不完整。
- 分词与 Jisho 查询能力已经作为工具基础存在，可用于后台候选词分析。

当前主要问题已经从“能不能识别词”转为“本地词库覆盖是否足够稳定”：

- NHK EASY 文章覆盖相对稳定，通常能达到 4-8 个精选词。
- TBS original 文章覆盖不均衡，部分文章只有 0-2 个精选词。
- 用户在 original 频道阅读时，容易感觉“精选词太少”。

因此下一步不建议继续调实时 API，而是建设一个本地词库补全生产线。

## 2. 目标

建立一个可重复运行的词库覆盖率报告与候选词生成流程，让后续补词不再靠手工浏览文章猜测。

成功标准：

- 可以一键扫描当前文章源，输出每篇文章的精选词数量。
- 可以找出低覆盖文章，例如精选词少于 3 个的文章。
- 可以基于分词结果输出“未收录候选词”清单。
- 候选词按出现频次、文章覆盖数、首次出现文章排序。
- 报告不直接修改用户阅读体验，也不把 Jisho 实时结果展示给用户。
- 后续工程师可以根据报告批量扩充 `src/lib/articles/dictionary.ts`。

## 3. 推荐实现

### 3.1 新增覆盖率报告脚本

建议新增：

```text
scripts/dictionary-coverage-report.mjs
```

脚本职责：

- 调用本地接口或直接复用文章管线读取 `easy` / `original` 文章。
- 对每篇文章执行当前本地词库匹配。
- 统计：
  - `articleId`
  - `channel`
  - `title`
  - `contentLength`
  - `vocabularyCount`
  - `vocabularyIds`
  - `isLowCoverage`
- 默认低覆盖阈值：`vocabularyCount < 3`。

建议输出到控制台即可，后续再决定是否写入文件：

```text
Dictionary coverage report

Channel: original
- 2636656 | 2 words | 旭山動物園職員...
  matched: suspect, police
  candidates: 逮捕, 動物園, 職員, 遺体, 損壊, 殺人, 捜査
```

### 3.2 复用候选词抽取

已有候选抽取模块：

```text
src/lib/articles/candidates.ts
```

脚本应复用 `extractVocabularyCandidates(text)`：

- 不恢复 `auto-*`。
- 不把候选词展示到文章页。
- 候选词只用于补词报告。

候选过滤建议：

- 排除已命中本地词库的 `surface` 和 `aliases`。
- 排除纯数字、日期、过短噪声、助词、常见功能词。
- 保留新闻高价值名词、复合词、动词名词化词。

### 3.3 Jisho 只作为后台辅助

已有 Jisho 查询模块：

```text
src/lib/articles/dictionary-api.ts
```

下一阶段可以先不在报告里强依赖 Jisho，避免报告运行过慢。

建议分两档：

1. 默认模式：只输出候选词，不查外部 API。
2. 可选模式：加参数 `--with-jisho`，为候选词补充读音、英文释义、词性。

示例：

```powershell
npm.cmd run report:dictionary
npm.cmd run report:dictionary -- --channel original --with-jisho
```

### 3.4 批量补本地词库

报告生成后，人工或后续 agent 根据候选清单扩充：

```text
src/lib/articles/dictionary.ts
```

每个新增词条必须包含：

- `id`
- `surface`
- `aliases`，如有
- `reading`
- `romaji`
- `level`
- `partOfSpeech`
- `meanings`
- `examples`
- `aiNote`

补词优先级：

1. original 频道低覆盖文章中高频出现的新闻词。
2. 多篇文章同时出现的通用新闻词。
3. 用户阅读价值高的关键词，而不是人名、地名、机构名堆积。
4. 能自然进入复习系统的词，避免只适合一次性查阅的专名。

## 4. Package Scripts

建议新增：

```json
{
  "scripts": {
    "report:dictionary": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dictionary-coverage-report.mjs"
  }
}
```

不建议让覆盖率报告阻塞 `npm.cmd run test`。

原因：

- 新闻源会变化。
- 外部内容拉取可能慢。
- 低覆盖本身是产品运营信号，不是构建失败。

## 5. 测试计划

### 单元测试

建议新增或扩展：

```text
tests/articles-dictionary-coverage.test.mjs
```

覆盖：

- 能识别低覆盖文章。
- 候选词不包含已经命中的本地词条。
- 候选词按正文首次出现或频次稳定排序。
- 不生成 `auto-*`。
- 不生成 `jisho-*` 进入文章词条结果。

### 本地验证命令

完成后至少运行：

```powershell
npm.cmd run test
npm.cmd run test:learning
npm.cmd run lint
npm.cmd run build
npm.cmd run report:dictionary
```

如 `localhost:3100` 可用，再运行：

```powershell
npm.cmd run test:content
```

## 6. 明确不做

本阶段不做：

- 不把 Jisho 实时词条重新混入文章页。
- 不在用户阅读时等待外部词典 API。
- 不自动把候选词写入 `dictionary.ts`。
- 不引入数据库。
- 不做用户登录或多端同步。
- 不把覆盖率过低作为 CI 失败条件。

## 7. 下一步任务一句话

新增 `scripts/dictionary-coverage-report.mjs` 和 `npm.cmd run report:dictionary`，扫描当前 easy/original 文章，输出低覆盖文章与未收录候选词清单，为下一轮批量扩充本地词库提供依据。
