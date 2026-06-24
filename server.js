const http = require("http");
const fs = require("fs");
const path = require("path");
const pb = require("./pb-client");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const stateFile = path.join(dataDir, "workbench-state.json");
const stackFile = path.join(rootDir, "open-source-stack.json");
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(stateFile)) {
    fs.writeFileSync(stateFile, JSON.stringify({ version: 1, updatedAt: new Date().toISOString() }, null, 2));
  }
}

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,PUT,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function resolveStaticPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  const filePath = path.normalize(path.join(rootDir, requested));
  if (!filePath.startsWith(rootDir)) {
    return "";
  }
  return filePath;
}

async function buildStateFromPocketBase() {
  const [profiles, tasks, publishItems] = await Promise.all([
    pb.listRecords("ip_profiles"),
    pb.listRecords("content_tasks"),
    pb.listRecords("publish_items"),
  ]);

  const profileRecord = profiles.items?.[0] || {};
  return {
    version: 1,
    source: "pocketbase",
    updatedAt: new Date().toISOString(),
    profile: {
      ipName: profileRecord.name || "",
      ipDomain: profileRecord.domain || "",
      audience: profileRecord.audience || "",
      promise: profileRecord.promise || "",
      voiceTone: profileRecord.voiceTone || "",
    },
    tasks: (tasks.items || []).map((task) => ({
      id: task.id,
      title: task.title || "",
      channel: task.channel || "",
      stage: task.stage || "idea",
    })),
    publish: (publishItems.items || []).map((item) => ({
      date: item.plannedDate ? new Date(item.plannedDate).toLocaleDateString("zh-CN") : item.metadata?.displayDate || "待定",
      title: item.title || "",
      channel: channelLabel(item.channel, item.metadata?.originalChannel),
    })),
  };
}

function channelLabel(value, fallback = "") {
  const labels = {
    wechat: "公众号",
    xhs: "小红书",
    jike: "即刻",
    douyin: "抖音",
    shipinhao: "视频号",
    bilibili: "B站",
    other: "其他",
  };
  return fallback || labels[value] || value || "";
}

function readStateFile() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(stateFile, "utf8").replace(/^\uFEFF/, ""));
}

function writeStateFile(state) {
  ensureDataFile();
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function escapeFilterValue(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

async function findFirstRecord(collection, filter) {
  const result = await pb.listRecords(collection, { filter, perPage: 1 });
  return result.items?.[0] || null;
}

async function upsertRecord(collection, filter, payload) {
  const existing = await findFirstRecord(collection, filter);
  if (existing) {
    return pb.updateRecord(collection, existing.id, payload);
  }
  return pb.createRecord(collection, payload);
}

function mapPublishChannel(channel = "") {
  if (channel.includes("公众号")) return "wechat";
  if (channel.includes("小红书")) return "xhs";
  if (channel.includes("即刻")) return "jike";
  if (channel.includes("抖音")) return "douyin";
  if (channel.includes("视频号")) return "shipinhao";
  if (channel.includes("B站")) return "bilibili";
  return "other";
}

async function syncStateToPocketBase(state) {
  const profile = state.profile || {};
  if (profile.ipName) {
    await upsertRecord("ip_profiles", `name = "${escapeFilterValue(profile.ipName)}"`, {
      name: profile.ipName,
      domain: profile.ipDomain || "",
      audience: profile.audience || "",
      promise: profile.promise || "",
      voiceTone: profile.voiceTone || "",
      metadata: { source: "workbench-ui" },
    });
  }

  for (const task of state.tasks || []) {
    if (!task.title) continue;
    await upsertRecord("content_tasks", `title = "${escapeFilterValue(task.title)}"`, {
      title: task.title,
      channel: task.channel || "",
      stage: task.stage || "idea",
      priority: "normal",
      metadata: { source: "workbench-ui", legacyId: task.id },
    });
  }

  for (const item of state.publish || []) {
    if (!item.title) continue;
    await upsertRecord("publish_items", `title = "${escapeFilterValue(item.title)}"`, {
      title: item.title,
      channel: mapPublishChannel(item.channel),
      status: "planned",
      metadata: {
        source: "workbench-ui",
        displayDate: item.date,
        originalChannel: item.channel,
      },
    });
  }
}

async function handleApi(req, res, urlPath) {
  ensureDataFile();

  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return true;
  }

  if (urlPath === "/api/health") {
    send(res, 200, JSON.stringify({ ok: true, service: "personal-ip-workbench", port }, null, 2));
    return true;
  }

  if (urlPath === "/api/stack" && req.method === "GET") {
    const body = fs.existsSync(stackFile) ? fs.readFileSync(stackFile, "utf8") : "[]";
    send(res, 200, body);
    return true;
  }

  if (urlPath === "/api/state" && req.method === "GET") {
    try {
      const state = await buildStateFromPocketBase();
      writeStateFile(state);
      send(res, 200, JSON.stringify(state, null, 2));
    } catch (error) {
      send(res, 200, fs.readFileSync(stateFile, "utf8"));
    }
    return true;
  }

  if (urlPath === "/api/state" && req.method === "PUT") {
    const raw = await readBody(req);
    const parsed = JSON.parse(raw);
    parsed.updatedAt = new Date().toISOString();
    writeStateFile(parsed);
    let synced = false;
    try {
      await syncStateToPocketBase(parsed);
      synced = true;
    } catch (error) {
      console.error(`failed to sync state to PocketBase: ${error.message}`);
    }
    send(res, 200, JSON.stringify({ ok: true, synced, updatedAt: parsed.updatedAt }, null, 2));
    return true;
  }

  if (urlPath === "/api/sync/from-pocketbase" && req.method === "POST") {
    const state = await buildStateFromPocketBase();
    writeStateFile(state);
    send(res, 200, JSON.stringify({ ok: true, state }, null, 2));
    return true;
  }

  const pbMatch = urlPath.match(/^\/api\/pb\/([a-z_]+)(?:\/([^/]+))?$/);
  if (pbMatch) {
    const [, collection, id] = pbMatch;

    if (req.method === "GET" && !id) {
      const list = await pb.listRecords(collection);
      send(res, 200, JSON.stringify(list, null, 2));
      return true;
    }

    if (req.method === "POST" && !id) {
      const payload = JSON.parse(await readBody(req));
      const record = await pb.createRecord(collection, payload);
      send(res, 200, JSON.stringify(record, null, 2));
      return true;
    }

    if (req.method === "PATCH" && id) {
      const payload = JSON.parse(await readBody(req));
      const record = await pb.updateRecord(collection, id, payload);
      send(res, 200, JSON.stringify(record, null, 2));
      return true;
    }

    if (req.method === "DELETE" && id) {
      await pb.deleteRecord(collection, id);
      send(res, 200, JSON.stringify({ ok: true }, null, 2));
      return true;
    }
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const urlPath = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`).pathname;

  try {
    if (urlPath.startsWith("/api/") && (await handleApi(req, res, urlPath))) {
      return;
    }

    const filePath = resolveStaticPath(urlPath);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      send(res, 404, "Not Found", "text/plain; charset=utf-8");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, fs.readFileSync(filePath), mimeTypes[ext] || "application/octet-stream");
  } catch (error) {
    send(res, 500, JSON.stringify({ ok: false, error: error.message }, null, 2));
  }
});

server.listen(port, host, () => {
  ensureDataFile();
  console.log(`Personal IP Workbench running at http://${host}:${port}`);
});
