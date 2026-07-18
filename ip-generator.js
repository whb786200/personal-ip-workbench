const styles = [
  {
    id: "caihui-feng",
    name: "彩绘风",
    tags: "彩绘卡通、暖色纸张、圆润角色、柔和表情",
    best: "头像、角色表、聊天表情包、温暖社交内容",
    fingerprint: "温暖纸张感，圆润 chibi 轮廓，深棕有机描边，水彩/彩铅质感，低到中饱和暖色。"
  },
  {
    id: "xian-tiao-feng",
    name: "线条风",
    tags: "黑白线稿、极简五官、手绘人物、表情优先",
    best: "极简头像、表情贴纸、编辑插画式个人身份",
    fingerprint: "黑白手绘线稿，留白构图，夸张但简洁的五官，靠线条和负空间表达。"
  },
  {
    id: "3d-feng",
    name: "3D 风",
    tags: "3D 卡通、潮流配饰、柔和材质、棚拍肖像",
    best: "精致社交头像、创作者人设、潮流风数字分身",
    fingerprint: "高质感 3D 卡通，柔和棚拍光，清晰材质，立体发型和配饰，时尚配色。"
  },
  {
    id: "illustration-feng",
    name: "插画风",
    tags: "平面插画、色块光影、时尚肖像、鲜明背景",
    best: "公众号封面、社交头像、人物卡片、现代品牌人设",
    fingerprint: "干净 2D 插画，色块光影，利落轮廓，鲜明背景，编辑感肖像。"
  },
  {
    id: "figure-feng",
    name: "手办风",
    tags: "收藏手办、哑光树脂、全身展示、柔和棚拍",
    best: "全身 IP 手办概念、收藏级角色预览、产品化展示",
    fingerprint: "哑光 PVC/树脂手办质感，1:3 到 1:4 头身比，柔和棚拍，干净全身展示。"
  }
];

const $ = (selector) => document.querySelector(selector);

function initStyles() {
  const select = $("#stylePreset");
  const cards = $("#styleCards");
  styles.forEach((style) => {
    const option = document.createElement("option");
    option.value = style.id;
    option.textContent = `${style.name} — ${style.tags}`;
    select.appendChild(option);

    const card = document.createElement("article");
    card.className = "style-card";
    card.innerHTML = `<strong>${style.name}</strong><p>${style.tags}</p><p>适用：${style.best}</p>`;
    cards.appendChild(card);
  });
}

function buildPrompt(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const style = styles.find((item) => item.id === data.stylePreset) || styles[0];
  return [
    "个人 IP 生成计划",
    "",
    `IP 类型：${data.ipType}`,
    `形象来源 / 代表 brief：${data.brief || "待补充"}`,
    `画风：${style.name}（${style.id}）`,
    `风格指纹：${style.fingerprint}`,
    `强化特征：${data.traits || "使用默认：突出清晰轮廓、稳定表情和可识别职业线索"}`,
    `配色方向：${data.palette || "使用所选画风默认配色"}`,
    `避免元素：${data.avoid || "不要商标、不要水印、不要文字、不要复制已有角色"}`,
    "",
    "第一步：生成一张 3x2 六款编号预览。",
    "要求：六个候选保持同一身份/brief、同一画风、同一配色；只变化轮廓、姿态、服装侧重、配饰侧重、表情能量。不要让图像模型生成编号，编号由宿主后期叠加。",
    "",
    "第二步：用户选择 1-6 中一个候选。",
    "",
    "第三步：基于选中候选生成正式头像和 3x3 表情包源图。",
    "表情顺序：开心、大笑、生气、委屈、惊讶、困惑、得意、疲惫、喜爱。",
    "",
    "最终交付：一张 4x3 成品板，左侧正式头像，右侧九宫格表情包；中文标题和标签由宿主叠加，不让图像模型生成中文。"
  ].join("\n");
}

function copyText() {
  const output = $("#promptOutput");
  output.focus();
  output.select();
  document.execCommand("copy");
}

$("#generatorForm").addEventListener("submit", (event) => {
  event.preventDefault();
  $("#promptOutput").value = buildPrompt(event.currentTarget);
});

$("#copyBtn").addEventListener("click", copyText);

initStyles();
$("#promptOutput").value = buildPrompt($("#generatorForm"));
