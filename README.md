# 个人数字化 IP 工作台

一个本地运行的个人 IP 内容运营工作台，集成：

- 中文后台：管理 IP 画像、内容任务、素材库、发布排期
- IP 形象生成器：头像、数字分身、表情包提示词
- 主工作台：总览、看板、提示词、开源工具栈
- PocketBase：本地 SQLite 数据库和底层 Admin UI
- MoneyPrinterTurbo 入口：AI 短视频生成系统

## 一键启动

Windows PowerShell：

```powershell
.\install.ps1
.\run-workbench.ps1
```

打开：

- 中文后台：http://127.0.0.1:8787/admin-cn.html
- IP 形象生成器：http://127.0.0.1:8787/ip-generator.html
- 主工作台：http://127.0.0.1:8787
- MoneyPrinterTurbo：http://127.0.0.1:8501

> `http://127.0.0.1:8090/_/` 是 PocketBase 原生后台，界面为英文，仅用于底层维护。日常请使用中文后台。

## 新电脑如何安装

1. 安装 Git、Node.js 24+、Python 3.11+。
2. 解压本项目安装包。
3. 在项目目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

4. 启动：

```powershell
powershell -ExecutionPolicy Bypass -File .\run-workbench.ps1
```

## 首次配置

MoneyPrinterTurbo 配置文件：

```text
D:\Users\19586\Documents\MoneyPrinterTurbo\config.toml
```

需要填：

```toml
llm_provider = "deepseek"
deepseek_api_key = "你的 DeepSeek API Key"
pexels_api_keys = ["你的 Pexels API Key"]
```

## 常用命令

自检：

```powershell
.\verify-workbench.ps1
```

同步 PocketBase：

```powershell
.\sync-pocketbase.ps1
```

清理乱码测试数据：

```powershell
.\repair-pocketbase.ps1
```

## 数据位置

- 工作台 JSON 备份：`data/workbench-state.json`
- PocketBase 数据库：`tools/pocketbase/pb_data/`
- PocketBase 管理员凭证：`local/pocketbase-superuser.json`，不会提交到 Git

## 目录说明

```text
admin-cn.*              中文后台
index.html/app.js       主工作台
server.js               本地服务和 API 代理
pb-client.js            PocketBase API 客户端
pb_migrations/          PocketBase 集合迁移
install.ps1             一键安装
run-workbench.ps1       一键启动
verify-workbench.ps1    自检
OPERATIONS.md           运营说明
```
