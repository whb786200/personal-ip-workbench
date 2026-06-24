const collections = {
  content_tasks: {
    title: "内容任务",
    hint: "管理选题、脚本、素材、成片和发布阶段",
    columns: [
      ["title", "标题"],
      ["channel", "渠道"],
      ["stage", "阶段"],
      ["priority", "优先级"],
      ["updated", "更新时间"],
    ],
    fields: [
      { key: "title", label: "标题", type: "text", required: true },
      { key: "channel", label: "渠道", type: "text" },
      { key: "stage", label: "阶段", type: "select", options: [["idea", "选题"], ["script", "脚本"], ["material", "素材"], ["video", "成片"], ["publish", "发布"]] },
      { key: "priority", label: "优先级", type: "select", options: [["low", "低"], ["normal", "普通"], ["high", "高"]] },
      { key: "sourceUrl", label: "来源链接", type: "url", wide: true },
      { key: "notes", label: "备注", type: "textarea", wide: true },
    ],
  },
  ip_profiles: {
    title: "IP 画像",
    hint: "管理定位、人群、承诺和内容风格",
    columns: [["name", "名称"], ["domain", "领域"], ["audience", "目标人群"], ["promise", "核心承诺"], ["updated", "更新时间"]],
    fields: [
      { key: "name", label: "名称", type: "text", required: true },
      { key: "domain", label: "领域", type: "text" },
      { key: "audience", label: "目标人群", type: "text", wide: true },
      { key: "promise", label: "核心承诺", type: "textarea", wide: true },
      { key: "voiceTone", label: "内容风格", type: "textarea", wide: true },
    ],
  },
  materials: {
    title: "素材库",
    hint: "管理链接、笔记、图片、视频、金句等素材",
    columns: [["title", "标题"], ["type", "类型"], ["sourceUrl", "来源链接"], ["updated", "更新时间"]],
    fields: [
      { key: "title", label: "标题", type: "text", required: true },
      { key: "type", label: "类型", type: "select", options: [["link", "链接"], ["note", "笔记"], ["image", "图片"], ["video", "视频"], ["audio", "音频"], ["quote", "金句"]] },
      { key: "sourceUrl", label: "来源链接", type: "url", wide: true },
      { key: "content", label: "内容", type: "textarea", wide: true },
    ],
  },
  publish_items: {
    title: "发布排期",
    hint: "管理待发布、已发布和复盘内容",
    columns: [["title", "标题"], ["channel", "平台"], ["status", "状态"], ["plannedDate", "计划时间"], ["updated", "更新时间"]],
    fields: [
      { key: "title", label: "标题", type: "text", required: true },
      { key: "channel", label: "平台", type: "select", options: [["wechat", "公众号"], ["xhs", "小红书"], ["jike", "即刻"], ["douyin", "抖音"], ["shipinhao", "视频号"], ["bilibili", "B站"], ["other", "其他"]] },
      { key: "status", label: "状态", type: "select", options: [["planned", "计划中"], ["drafted", "已出稿"], ["published", "已发布"], ["review", "待复盘"]] },
      { key: "plannedDate", label: "计划时间", type: "datetime-local" },
      { key: "url", label: "发布链接", type: "url", wide: true },
    ],
  },
};

let activeCollection = "content_tasks";
let activeRecord = null;
let records = [];

const $ = (selector) => document.querySelector(selector);

function labelValue(field, value) {
  const config = collections[activeCollection].fields.find((item) => item.key === field);
  if (!config?.options) return value || "";
  return config.options.find(([key]) => key === value)?.[1] || value || "";
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(body?.error || text || response.statusText);
  return body;
}

function renderNav() {
  const nav = $("#collectionNav");
  nav.innerHTML = "";
  Object.entries(collections).forEach(([key, config]) => {
    const button = document.createElement("button");
    button.className = `nav-btn${key === activeCollection ? " active" : ""}`;
    button.type = "button";
    button.textContent = config.title;
    button.addEventListener("click", () => {
      activeCollection = key;
      loadRecords();
    });
    nav.appendChild(button);
  });
}

function renderTable() {
  const config = collections[activeCollection];
  $("#collectionTitle").textContent = config.title;
  $("#collectionHint").textContent = config.hint;
  $("#summary").textContent = `当前共 ${records.length} 条记录。点击任意一行可编辑。`;

  $("#tableHead").innerHTML = `<tr>${config.columns.map(([, label]) => `<th>${label}</th>`).join("")}</tr>`;
  const body = $("#tableBody");
  body.innerHTML = "";
  records.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = config.columns
      .map(([field]) => `<td>${escapeHtml(formatCell(field, record[field]))}</td>`)
      .join("");
    row.addEventListener("click", () => openDialog(record));
    body.appendChild(row);
  });
}

function formatCell(field, value) {
  if (field === "updated" || field === "created") return value ? new Date(value).toLocaleString("zh-CN") : "";
  if (field === "plannedDate") return value ? new Date(value).toLocaleString("zh-CN") : "";
  return labelValue(field, value);
}

async function loadRecords() {
  renderNav();
  const result = await api(`/api/pb/${activeCollection}`);
  records = result.items || [];
  renderTable();
}

function openDialog(record = null) {
  activeRecord = record;
  const config = collections[activeCollection];
  $("#dialogTitle").textContent = record ? `编辑${config.title}` : `新增${config.title}`;
  $("#deleteBtn").style.display = record ? "inline-flex" : "none";

  const fields = $("#formFields");
  fields.innerHTML = "";
  config.fields.forEach((field) => {
    const label = document.createElement("label");
    if (field.wide || field.type === "textarea") label.className = "wide";
    label.textContent = field.label;
    const input = createInput(field, record?.[field.key]);
    label.appendChild(input);
    fields.appendChild(label);
  });
  $("#recordDialog").showModal();
}

function createInput(field, value = "") {
  if (field.type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.name = field.key;
    textarea.value = value || "";
    return textarea;
  }
  if (field.type === "select") {
    const select = document.createElement("select");
    select.name = field.key;
    field.options.forEach(([key, label]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = label;
      option.selected = key === value;
      select.appendChild(option);
    });
    return select;
  }
  const input = document.createElement("input");
  input.name = field.key;
  input.type = field.type || "text";
  input.required = Boolean(field.required);
  input.value = field.type === "datetime-local" && value ? toDatetimeLocal(value) : value || "";
  return input;
}

function toDatetimeLocal(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function readFormPayload() {
  const payload = {};
  const form = $("#recordForm");
  collections[activeCollection].fields.forEach((field) => {
    const value = form.elements[field.key].value.trim();
    payload[field.key] = value;
  });
  return payload;
}

async function saveRecord(event) {
  event.preventDefault();
  const payload = readFormPayload();
  if (activeRecord) {
    await api(`/api/pb/${activeCollection}/${activeRecord.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } else {
    await api(`/api/pb/${activeCollection}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  $("#recordDialog").close();
  await loadRecords();
}

async function deleteRecord() {
  if (!activeRecord) return;
  if (!confirm("确认删除这条记录？")) return;
  await api(`/api/pb/${activeCollection}/${activeRecord.id}`, { method: "DELETE" });
  $("#recordDialog").close();
  await loadRecords();
}

async function syncToWorkbench() {
  const result = await api("/api/sync/from-pocketbase", { method: "POST", body: "{}" });
  $("#summary").textContent = result.ok ? "已同步到工作台总览。" : "同步失败。";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

$("#refreshBtn").addEventListener("click", loadRecords);
$("#syncStateBtn").addEventListener("click", syncToWorkbench);
$("#newBtn").addEventListener("click", () => openDialog());
$("#recordForm").addEventListener("submit", saveRecord);
$("#deleteBtn").addEventListener("click", deleteRecord);

loadRecords().catch((error) => {
  $("#summary").textContent = `加载失败：${error.message}`;
});
