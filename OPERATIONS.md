# 个人数字化 IP 工作台运营手册

## 当前可运行组件

- 工作台入口：`http://127.0.0.1:8787`
- 中文后台：`http://127.0.0.1:8787/admin-cn.html`
- IP 形象生成器：`http://127.0.0.1:8787/ip-generator.html`
- 本地数据 API：`server.js`
- 数据文件：`data/workbench-state.json`
- PocketBase 原生后台：`http://127.0.0.1:8090/_/`（英文，仅用于底层维护）
- 视频生成：`D:\Users\19586\Documents\MoneyPrinterTurbo`
- MoneyPrinterTurbo WebUI：`http://127.0.0.1:8501`

## 推荐开源融合架构

| 模块 | 项目 | 作用 | 当前状态 |
| --- | --- | --- | --- |
| 总控台 | 本仓库静态工作台 | IP 画像、内容看板、开源工具入口 | 已完成 |
| IP 形象生成 | Personal IP Generator | 头像、数字分身、表情包提示词 | 已安装 Skill |
| AI 视频生成 | MoneyPrinterTurbo | 选题/脚本到短视频 | 已安装运行 |
| 轻量数据库 | PocketBase | SQLite + Admin UI + REST API | 已安装运行 |
| 内容数据库 | NocoDB | 选题库、素材库、发布表、复盘表 | 待接入 |
| 社媒排期 | Postiz | 多平台排期和发布 | 待 Docker |
| 自动化编排 | Activepieces | 触发生成、通知、回填、复盘 | 待 Docker |
| 视频精剪 | OpenCut | 浏览器内二次剪辑 | 待 Node/pnpm |
| SOP 知识库 | Docmost | 栏目 SOP、提示词、复盘沉淀 | 待 Docker |
| AI 工作流 | Dify | 标题/脚本/素材提炼助手 | 待 Docker |
| 表格数据库备选 | Baserow | 类 Airtable 内容库 | 待 Docker |
| 自动化备选 | Node-RED | 低代码自动化 | 待 npm |
| LLM 工作流备选 | Flowise | 可视化 AI 助手 | 待 npm |
| 灵感记录备选 | Memos | 日常素材捕捉 | 待 Docker/二进制 |
| 素材收藏备选 | Karakeep | 网页/图片/书签素材库 | 待 Docker |
| 社媒发布备选 | Mixpost | Postiz 替代评估项 | 待 Docker/PHP |

> 许可注意：PocketBase 和 MoneyPrinterTurbo 是 MIT；Dify 使用带附加条件的 Dify Open Source License；NocoDB 当前许可和开源边界需要在商业化前复核。内部自用问题不大，作为对外产品打包销售前必须重新审查许可。

## 运营闭环

1. 记录素材：把灵感、链接、报错、实战过程写入工作台任务。
2. 生成脚本：在工作台复制脚本提示词，交给 DeepSeek 或 Dify 助手。
3. 生成视频：打开 MoneyPrinterTurbo，粘贴主题或脚本生成视频。
4. 人工精剪：需要二次编辑时，交给 OpenCut 或本地剪辑软件。
5. 排期发布：短期先手动发布；接入 Postiz 后统一管理排期。
6. 自动回填：接入 Activepieces 后，把生成结果、发布时间、链接回填到 NocoDB。
7. 周复盘：统计发布数量、播放、收藏、线索、复用素材，更新 IP 画像。

## 本机运行

```powershell
Set-Location "D:\Users\19586\Documents\video IP igent"
.\run-workbench.ps1
```

单独启动工作台数据服务：

```powershell
Set-Location "D:\Users\19586\Documents\video IP igent"
node server.js
```

安装 PocketBase：

```powershell
Set-Location "D:\Users\19586\Documents\video IP igent"
.\install-pocketbase.ps1
```

初始化 PocketBase 集合和本地管理员：

```powershell
Set-Location "D:\Users\19586\Documents\video IP igent"
.\init-pocketbase.ps1
.\run-workbench.ps1
```

管理员邮箱默认是 `admin@personal-ip.local`，密码保存在本机忽略目录 `local/pocketbase-superuser.json`。

中文后台：

```text
http://127.0.0.1:8787/admin-cn.html
```

`http://127.0.0.1:8090/_/` 是 PocketBase 原生后台，界面是英文；日常增删改查请使用上面的中文后台。

中文后台已汉化并封装常用集合：

- 内容任务：选题、脚本、素材、成片、发布阶段
- IP 画像：名称、领域、人群、承诺、风格
- 素材库：链接、笔记、图片、视频、金句
- 发布排期：平台、状态、计划时间、发布链接

中文后台右上角“同步到工作台”会把 PocketBase 数据回写到 `data/workbench-state.json`，主工作台刷新后读取最新状态。

健康检查：

```powershell
curl http://127.0.0.1:8787/api/health
```

完整自检：

```powershell
Set-Location "D:\Users\19586\Documents\video IP igent"
.\verify-workbench.ps1
```

同步当前工作台 JSON 到 PocketBase：

```powershell
Set-Location "D:\Users\19586\Documents\video IP igent"
.\sync-pocketbase.ps1
```

清理 PowerShell 编码测试导致的乱码记录：

```powershell
Set-Location "D:\Users\19586\Documents\video IP igent"
.\repair-pocketbase.ps1
```

## 后续接入顺序

1. PocketBase：已创建 `ip_profiles`、`content_tasks`、`materials`、`publish_items` 集合；用 `sync-pocketbase.ps1` 同步工作台数据。
2. NocoDB：如果后续需要类 Airtable 表格界面，再从 PocketBase/JSON 迁移。
3. Activepieces：自动同步“新增选题 -> 生成提示词 -> 通知处理”。
4. Postiz：接入排期发布。
5. OpenCut：补人工剪辑入口。
6. Docmost/Dify：把 SOP 和 AI 助手沉淀成长期能力。

## 基础运维

- 每天：确认 `http://127.0.0.1:8501` 可访问。
- 每周：导出工作台 JSON，备份到云盘或 Git。
- 每月：更新 MoneyPrinterTurbo，复查 `config.toml` 中的 API Key 是否有效。
- 大改前：复制 `config.toml`、工作台导出 JSON、成片目录。
