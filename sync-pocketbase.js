const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const pbUrl = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const credentialFile = path.join(rootDir, "local", "pocketbase-superuser.json");
const stateFile = path.join(rootDir, "data", "workbench-state.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

async function request(pathname, options = {}) {
  const response = await fetch(`${pbUrl}${pathname}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathname} failed: ${response.status} ${text}`);
  }
  return body;
}

async function authenticate() {
  const credential = readJson(credentialFile);
  const auth = await request("/api/collections/_superusers/auth-with-password", {
    method: "POST",
    body: JSON.stringify({
      identity: credential.email,
      password: credential.password,
    }),
  });
  return auth.token;
}

async function findFirst(collection, filter, token) {
  const query = new URLSearchParams({ filter, perPage: "1" });
  const list = await request(`/api/collections/${collection}/records?${query.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return list.items?.[0] || null;
}

async function upsert(collection, uniqueFilter, payload, token) {
  const existing = await findFirst(collection, uniqueFilter, token);
  if (existing) {
    return request(`/api/collections/${collection}/records/${existing.id}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  }
  return request(`/api/collections/${collection}/records`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

async function main() {
  if (!fs.existsSync(credentialFile)) {
    throw new Error(`Missing PocketBase credential file: ${credentialFile}`);
  }
  if (!fs.existsSync(stateFile)) {
    throw new Error(`Missing workbench state file: ${stateFile}`);
  }

  const token = await authenticate();
  const state = readJson(stateFile);

  const profile = state.profile || {};
  if (profile.ipName) {
    await upsert(
      "ip_profiles",
      `name = "${profile.ipName.replaceAll('"', '\\"')}"`,
      {
        name: profile.ipName,
        domain: profile.ipDomain || "",
        audience: profile.audience || "",
        promise: profile.promise || "",
        voiceTone: profile.voiceTone || "",
        metadata: { source: "workbench-state.json" },
      },
      token
    );
  }

  for (const task of state.tasks || []) {
    await upsert(
      "content_tasks",
      `title = "${String(task.title || "").replaceAll('"', '\\"')}"`,
      {
        title: task.title,
        channel: task.channel || "",
        stage: task.stage || "idea",
        priority: "normal",
        notes: "",
        metadata: {
          source: "workbench-state.json",
          legacyId: task.id,
        },
      },
      token
    );
  }

  for (const item of state.publish || []) {
    await upsert(
      "publish_items",
      `title = "${String(item.title || "").replaceAll('"', '\\"')}"`,
      {
        title: item.title,
        channel: mapChannel(item.channel),
        status: "planned",
        metadata: {
          source: "workbench-state.json",
          displayDate: item.date,
          originalChannel: item.channel,
        },
      },
      token
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        profile: profile.ipName || "",
        tasks: (state.tasks || []).length,
        publish: (state.publish || []).length,
      },
      null,
      2
    )
  );
}

function mapChannel(channel = "") {
  if (channel.includes("公众号")) return "wechat";
  if (channel.includes("小红书")) return "xhs";
  if (channel.includes("即刻")) return "jike";
  if (channel.includes("抖音")) return "douyin";
  if (channel.includes("视频号")) return "shipinhao";
  if (channel.includes("B站")) return "bilibili";
  return "other";
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
