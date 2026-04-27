# Japanese News Reading PWA

一个面向中文用户的日语新闻学习项目，采用移动端优先的 PWA 形态，帮助用户通过真实新闻内容进行轻量、高频的阅读训练。

## Features

- 双频道阅读：首页支持简易新闻与原文新闻切换
- 文章详情页：包含正文阅读、词汇高亮与词汇卡片
- 单词本：集中查看收藏词汇
- 复习页：用于后续接入记忆复习流程
- 个人页：展示学习状态与个人入口

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## Local Development

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:3000
```

## Production Check

```bash
npm run build
```

当前项目已通过一次生产构建验证。

## Project Structure

```text
src/app        Next.js App Router pages
src/components UI screens and reusable components
src/lib        Mock data and shared utilities
docs           Product and handoff notes
```
