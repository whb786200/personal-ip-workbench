const STORAGE_KEY = "personal-ip-workbench-v1";
const apiBase = window.location.protocol === "file:" ? "http://127.0.0.1:8787" : "";
let saveTimer = 0;
let remoteEnabled = false;

const stages = [
  ["idea", "选题"],
  ["script", "脚本"],
  ["material", "素材"],
  ["video", "成片"],
  ["publish", "发布"],
];

const openSourceStack = [
  {
    name: "MoneyPrinterTurbo",
    role: "AI 短视频生成",
    license: "MIT",
    status: "已接入本机",
    url: "https://github.com/harry0703/MoneyPrinterTurbo",
    local: "http://127.0.0.1:8501",
    command: "uv run streamlit run ./webui/Main.py",
    desc: "从选题和脚本生成视频文案、素材、字幕、配音和成片，是当前工作台的视频生产引擎。",
  },
  {
    name: "Postiz",
    role: "社媒排期发布",
    license: "AGPL-3.0",
    status: "待 Docker",
    url: "https://github.com/gitroomhq/postiz-app",
    local: "",
    command: "docker compose up -d",
    desc: "开源社媒管理与排期工具，适合作为多平台发布日历和团队审批层。",
  },
  {
    name: "Activepieces",
    role: "自动化编排",
    license: "MIT",
    status: "待 Docker/Node",
    url: "https://github.com/activepieces/activepieces",
    local: "",
    command: "docker compose up -d",
    desc: "把选题、生成、入库、通知、发布回填等动作串成自动化流程。",
  },
  {
    name: "PocketBase",
    role: "轻量内容数据库",
    license: "MIT",
    status: "已接入本机",
    url: "https://github.com/pocketbase/pocketbase",
    local: "http://127.0.0.1:8090/_/",
    command: "tools\\pocketbase\\pocketbase.exe serve --http=127.0.0.1:8090",
    desc: "单文件开源后端，内置 SQLite、Admin UI 和 REST API。适合作为 NocoDB 之前的轻量内容库。",
  },
  {
    name: "Baserow",
    role: "表格数据库备选",
    license: "需复核",
    status: "待 Docker",
    url: "https://gitlab.com/baserow/baserow",
    local: "",
    command: "docker compose up -d",
    desc: "类 Airtable 的开源数据库界面，适合把选题、素材和排期交给表格化团队协作。",
  },
  {
    name: "Node-RED",
    role: "自动化备选",
    license: "Apache-2.0",
    status: "待 npm",
    url: "https://github.com/node-red/node-red",
    local: "",
    command: "npm install -g node-red && node-red",
    desc: "成熟的低代码自动化编排工具，可替代或补充 Activepieces。",
  },
  {
    name: "Flowise",
    role: "LLM 工作流备选",
    license: "Apache-2.0",
    status: "待 npm",
    url: "https://github.com/FlowiseAI/Flowise",
    local: "",
    command: "npx flowise start",
    desc: "可视化 LLM 应用编排，适合搭建标题助手、脚本助手、素材摘要助手。",
  },
  {
    name: "Memos",
    role: "灵感记录备选",
    license: "MIT",
    status: "待 Docker/二进制",
    url: "https://github.com/usememos/memos",
    local: "",
    command: "docker run -p 5230:5230 ghcr.io/usememos/memos:stable",
    desc: "轻量微博客/备忘录工具，适合日常素材捕捉和灵感沉淀。",
  },
  {
    name: "Karakeep",
    role: "素材收藏备选",
    license: "AGPL-3.0",
    status: "待 Docker",
    url: "https://github.com/karakeep-app/karakeep",
    local: "",
    command: "docker compose up -d",
    desc: "书签、网页、图片的自托管收藏库，适合做长期素材库和参考库。",
  },
  {
    name: "Mixpost",
    role: "社媒发布备选",
    license: "需复核",
    status: "待 Docker/PHP",
    url: "https://github.com/inovector/mixpost",
    local: "",
    command: "docker compose up -d",
    desc: "社交媒体管理和排期工具，可作为 Postiz 的替代评估项。",
  },
  {
    name: "NocoDB",
    role: "内容数据库",
    license: "需复核",
    status: "可选接入",
    url: "https://github.com/nocodb/nocodb",
    local: "",
    command: "npx nocodb",
    desc: "开源 Airtable 替代，可承载选题库、素材库、发布日历和数据复盘表。",
  },
  {
    name: "OpenCut",
    role: "浏览器剪辑",
    license: "MIT",
    status: "可选接入",
    url: "https://github.com/OpenCut-app/OpenCut",
    local: "",
    command: "pnpm install && pnpm dev",
    desc: "开源 CapCut 替代，用于对 AI 成片做人工精剪、封面和片段重组。",
  },
  {
    name: "Docmost",
    role: "知识库与 SOP",
    license: "AGPL-3.0",
    status: "待 Docker",
    url: "https://github.com/docmost/docmost",
    local: "",
    command: "docker compose up -d",
    desc: "沉淀账号定位、栏目 SOP、复盘报告、提示词和团队协作规范。",
  },
  {
    name: "Dify",
    role: "AI 应用与工作流",
    license: "Dify OSL",
    status: "待 Docker",
    url: "https://github.com/langgenius/dify",
    local: "",
    command: "docker compose up -d",
    desc: "把 DeepSeek/本地模型封装成脚本助手、标题助手、素材提炼助手和 RAG 应用。",
  },
];

const initialState = {
  profile: {
    ipName: "个人数字化 IP",
    ipDomain: "AI 短视频与个人品牌",
    audience: "想用 AI 做内容资产的个人创作者",
    promise: "把想法整理成可生产、可发布、可复盘的内容系统",
    voiceTone: "直接、实操、案例化、少空话",
  },
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "用 MoneyPrinterTurbo 生成第一条短视频",
      channel: "视频号 / 抖音",
      stage: "video",
    },
    {
      id: crypto.randomUUID(),
      title: "整理个人 IP 的三类固定栏目",
      channel: "公众号 / 即刻",
      stage: "script",
    },
    {
      id: crypto.randomUUID(),
      title: "写一篇部署过程复盘",
      channel: "公众号",
      stage: "idea",
    },
  ],
  publish: [
    { date: "周一", title: "AI 工具部署踩坑复盘", channel: "公众号" },
    { date: "周三", title: "60 秒演示：从选题到短视频", channel: "视频号" },
    { date: "周五", title: "个人知识库如何变成内容资产", channel: "小红书" },
  ],
};

let state = loadState();

const fields = ["ipName", "ipDomain", "audience", "promise", "voiceTone"];
const $ = (selector) => document.querySelector(selector);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.profile && Array.isArray(saved.tasks)) {
      return saved;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return structuredClone(initialState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!remoteEnabled) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch(`${apiBase}/api/state`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {
      remoteEnabled = false;
      renderStorageMode();
    });
  }, 250);
}

function syncProfileForm() {
  fields.forEach((field) => {
    const input = document.getElementById(field);
    input.value = state.profile[field] || "";
  });
}

function readProfileForm() {
  fields.forEach((field) => {
    state.profile[field] = document.getElementById(field).value.trim();
  });
  saveState();
  render();
}

function profileClarity() {
  const filled = fields.filter((field) => state.profile[field]).length;
  return Math.round((filled / fields.length) * 100);
}

function buildPrompt() {
  const p = state.profile;
  return [
    "请为我的个人数字化 IP 生成一条短视频脚本。",
    "",
    `IP 名称：${p.ipName || "未填写"}`,
    `领域：${p.ipDomain || "未填写"}`,
    `目标人群：${p.audience || "未填写"}`,
    `核心承诺：${p.promise || "未填写"}`,
    `内容风格：${p.voiceTone || "未填写"}`,
    "",
    "输出要求：",
    "1. 标题 3 个，保留强钩子但不要夸张。",
    "2. 正文按 15 秒开头、45 秒主体、15 秒收束组织。",
    "3. 每段给出画面建议、字幕句子和口播文案。",
    "4. 结尾给出一个低压力关注理由。",
    "5. 适合导入 MoneyPrinterTurbo 继续生成视频。",
  ].join("\n");
}

function generateIdeas() {
  const p = state.profile;
  const audience = p.audience || "目标用户";
  const domain = p.ipDomain || "你的领域";
  const topics = [
    `我如何用 ${domain} 搭建一个可复用内容流程`,
    `${audience} 最容易忽略的 3 个执行细节`,
    `从一个真实案例看 ${domain} 的投入产出`,
    `把复杂工具变成日常流程的 5 步法`,
    `新手做个人 IP 前必须先定下的边界`,
  ];

  const existing = new Set(state.tasks.map((task) => task.title));
  topics.forEach((title, index) => {
    if (!existing.has(title)) {
      state.tasks.unshift({
        id: crypto.randomUUID(),
        title,
        channel: index % 2 === 0 ? "视频号 / 抖音" : "公众号 / 小红书",
        stage: "idea",
      });
    }
  });
  saveState();
  render();
}

function addTask() {
  const title = window.prompt("新内容标题");
  if (!title || !title.trim()) return;
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title: title.trim(),
    channel: "待定渠道",
    stage: "idea",
  });
  saveState();
  render();
}

function addPublish() {
  const ready = state.tasks.find((task) => task.stage === "publish") || state.tasks[0];
  if (!ready) return;
  const day = ["周一", "周二", "周三", "周四", "周五"][state.publish.length % 5];
  state.publish.unshift({ date: day, title: ready.title, channel: ready.channel });
  saveState();
  render();
}

function renderMetrics() {
  $("#metricIdeas").textContent = String(state.tasks.length);
  $("#metricActive").textContent = String(
    state.tasks.filter((task) => ["script", "material", "video"].includes(task.stage)).length
  );
  $("#metricPublish").textContent = String(state.tasks.filter((task) => task.stage === "publish").length);
  $("#metricClarity").textContent = `${profileClarity()}%`;
}

function renderStorageMode() {
  const node = $("#storageMode");
  if (!node) return;
  node.textContent = remoteEnabled ? "数据层：本地 JSON API 已连接" : "数据层：浏览器本地";
}

function renderAsset() {
  $("#assetTitle").textContent = state.profile.ipName || "未命名 IP";
  $("#assetSubtitle").textContent = state.profile.promise || "定位、生产、发布集中管理";
}

function renderKanban() {
  const kanban = $("#kanban");
  kanban.innerHTML = "";

  stages.forEach(([stageId, label]) => {
    const column = document.createElement("section");
    column.className = "stage-column";

    const tasks = state.tasks.filter((task) => task.stage === stageId);
    const title = document.createElement("div");
    title.className = "stage-title";
    title.innerHTML = `<span>${label}</span><span class="stage-count">${tasks.length}</span>`;
    column.appendChild(title);

    const list = document.createElement("div");
    list.className = "task-list";
    tasks.forEach((task) => list.appendChild(renderTask(task)));
    column.appendChild(list);
    kanban.appendChild(column);
  });
}

function renderTask(task) {
  const template = $("#taskTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.stage = task.stage;
  node.querySelector(".task-title").textContent = task.title;
  node.querySelector(".task-meta").textContent = task.channel;

  const select = node.querySelector(".task-stage");
  stages.forEach(([stageId, label]) => {
    const option = document.createElement("option");
    option.value = stageId;
    option.textContent = label;
    option.selected = stageId === task.stage;
    select.appendChild(option);
  });
  select.addEventListener("change", () => {
    task.stage = select.value;
    saveState();
    render();
  });
  return node;
}

function renderPublish() {
  const list = $("#publishList");
  list.innerHTML = "";
  state.publish.slice(0, 8).forEach((item) => {
    const row = document.createElement("article");
    row.className = "publish-item";
    row.innerHTML = `
      <span class="publish-date">${item.date}</span>
      <span>
        <span class="publish-title"></span>
        <span class="publish-channel"></span>
      </span>
    `;
    row.querySelector(".publish-title").textContent = item.title;
    row.querySelector(".publish-channel").textContent = item.channel;
    list.appendChild(row);
  });
}

function renderOpenSourceStack() {
  $("#stackSummary").textContent =
    "推荐架构：当前本地工作台做总控台；MoneyPrinterTurbo 负责视频生成；NocoDB/Docmost 管内容资产；Activepieces 编排自动化；Postiz 管发布；OpenCut 做人工精剪；Dify 承载可复用 AI 助手。";

  const grid = $("#openSourceGrid");
  grid.innerHTML = "";
  openSourceStack.forEach((tool) => {
    const card = document.createElement("article");
    card.className = "tool-item";
    const localLink = tool.local
      ? `<a href="${tool.local}" target="_blank" rel="noreferrer">本地入口</a>`
      : "";
    card.innerHTML = `
      <div class="tool-tags">
        <span class="tag"></span>
        <span class="tag"></span>
        <span class="tag"></span>
      </div>
      <strong></strong>
      <p class="tool-desc"></p>
      <div class="tool-command"></div>
      <div class="tool-actions">
        <a class="source-link" target="_blank" rel="noreferrer">源码</a>
        ${localLink}
      </div>
    `;
    const tags = card.querySelectorAll(".tag");
    tags[0].textContent = tool.role;
    tags[1].textContent = tool.license;
    tags[2].textContent = tool.status;
    card.querySelector("strong").textContent = tool.name;
    card.querySelector(".tool-desc").textContent = tool.desc;
    card.querySelector(".tool-command").textContent = tool.command;
    card.querySelector(".source-link").href = tool.url;
    grid.appendChild(card);
  });
}

function renderPrompt() {
  $("#promptBox").value = buildPrompt();
}

function render() {
  syncProfileForm();
  renderStorageMode();
  renderMetrics();
  renderAsset();
  renderKanban();
  renderOpenSourceStack();
  renderPublish();
  renderPrompt();
}

async function loadRemoteState() {
  try {
    const response = await fetch(`${apiBase}/api/state`, { cache: "no-store" });
    if (!response.ok) return;
    const remoteState = await response.json();
    remoteEnabled = true;
    if (remoteState.profile && Array.isArray(remoteState.tasks)) {
      state = remoteState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    render();
  } catch {
    remoteEnabled = false;
    renderStorageMode();
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "personal-ip-workbench.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function copyPrompt() {
  const promptBox = $("#promptBox");
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(promptBox.value);
    return;
  }
  promptBox.focus();
  promptBox.select();
  document.execCommand("copy");
}

async function copyOpsChecklist() {
  const lines = [
    "个人数字化 IP 工作台运营清单",
    "",
    "每日：记录素材、补充选题、检查制作中任务。",
    "每周：批量生成 3-5 条脚本，产出 2 条短视频，发布 1 篇长文。",
    "每月：复盘主题表现，更新 IP 画像，清理低价值栏目。",
    "",
    "开源工具链：",
    ...openSourceStack.map((tool) => `- ${tool.name}：${tool.role}；运行：${tool.command}`),
  ];
  const text = lines.join("\n");
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const box = $("#promptBox");
  box.value = text;
  box.focus();
  box.select();
  document.execCommand("copy");
  renderPrompt();
}

function resetData() {
  if (!window.confirm("确认重置本地工作台数据？")) return;
  state = structuredClone(initialState);
  saveState();
  render();
}

$("#saveProfileBtn").addEventListener("click", readProfileForm);
$("#ideaBtn").addEventListener("click", generateIdeas);
$("#addTaskBtn").addEventListener("click", addTask);
$("#addPublishBtn").addEventListener("click", addPublish);
$("#copyPromptBtn").addEventListener("click", copyPrompt);
$("#copyOpsBtn").addEventListener("click", copyOpsChecklist);
$("#exportBtn").addEventListener("click", exportJson);
$("#resetBtn").addEventListener("click", resetData);
fields.forEach((field) => document.getElementById(field).addEventListener("change", readProfileForm));

render();
loadRemoteState();
