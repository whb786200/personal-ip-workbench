const { listRecords, deleteRecord } = require("./pb-client");

async function removeMojibake(collection, fields) {
  const list = await listRecords(collection, { perPage: 200 });
  let removed = 0;
  for (const record of list.items || []) {
    const hasMojibake = fields.some((field) => String(record[field] || "").includes("?"));
    const fromBadTest = record.metadata?.source === "workbench-ui" && hasMojibake;
    if (fromBadTest) {
      await deleteRecord(collection, record.id);
      removed += 1;
    }
  }
  return removed;
}

async function main() {
  const removed = {
    content_tasks: await removeMojibake("content_tasks", ["title", "channel"]),
    publish_items: await removeMojibake("publish_items", ["title"]),
  };
  console.log(JSON.stringify({ ok: true, removed }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
