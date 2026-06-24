const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const pbUrl = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const credentialFile = path.join(rootDir, "local", "pocketbase-superuser.json");

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

async function listRecords(collection, options = {}) {
  const token = await authenticate();
  const query = new URLSearchParams({
    page: String(options.page || 1),
    perPage: String(options.perPage || 100),
  });
  if (options.sort) query.set("sort", options.sort);
  if (options.filter) query.set("filter", options.filter);
  return request(`/api/collections/${collection}/records?${query.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

async function createRecord(collection, payload) {
  const token = await authenticate();
  return request(`/api/collections/${collection}/records`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

async function updateRecord(collection, id, payload) {
  const token = await authenticate();
  return request(`/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

async function deleteRecord(collection, id) {
  const token = await authenticate();
  return request(`/api/collections/${collection}/records/${id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
}

module.exports = {
  pbUrl,
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
};
