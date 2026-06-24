migrate((app) => {
  const collections = [
    new Collection({
      type: "base",
      name: "ip_profiles",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "domain", type: "text" },
        { name: "audience", type: "text" },
        { name: "promise", type: "text" },
        { name: "voiceTone", type: "text" },
        { name: "metadata", type: "json" },
      ],
    }),
    new Collection({
      type: "base",
      name: "content_tasks",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "channel", type: "text" },
        { name: "stage", type: "select", values: ["idea", "script", "material", "video", "publish"], maxSelect: 1 },
        { name: "priority", type: "select", values: ["low", "normal", "high"], maxSelect: 1 },
        { name: "sourceUrl", type: "url" },
        { name: "notes", type: "editor" },
        { name: "metadata", type: "json" },
      ],
    }),
    new Collection({
      type: "base",
      name: "materials",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "type", type: "select", values: ["link", "note", "image", "video", "audio", "quote"], maxSelect: 1 },
        { name: "sourceUrl", type: "url" },
        { name: "content", type: "editor" },
        { name: "tags", type: "json" },
        { name: "metadata", type: "json" },
      ],
    }),
    new Collection({
      type: "base",
      name: "publish_items",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "channel", type: "select", values: ["wechat", "xhs", "jike", "douyin", "shipinhao", "bilibili", "other"], maxSelect: 1 },
        { name: "plannedDate", type: "date" },
        { name: "status", type: "select", values: ["planned", "drafted", "published", "review"], maxSelect: 1 },
        { name: "url", type: "url" },
        { name: "metrics", type: "json" },
        { name: "metadata", type: "json" },
      ],
    }),
  ]

  for (const collection of collections) {
    try {
      app.findCollectionByNameOrId(collection.name)
    } catch {
      app.save(collection)
    }
  }
}, (app) => {
  for (const name of ["publish_items", "materials", "content_tasks", "ip_profiles"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name))
    } catch {
      // already removed
    }
  }
})
