const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dist = path.join(root, "dist");
const serverDir = path.join(dist, "server");
const openAiDir = path.join(dist, ".openai");

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(openAiDir, { recursive: true });
fs.copyFileSync(path.join(root, ".openai", "hosting.json"), path.join(openAiDir, "hosting.json"));

const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "script.js"), "utf8");
const imageMimeTypes = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace(
  '<link rel="stylesheet" href="styles.css" />',
  `<style>${css}</style>`,
);
html = html.replace(
  '<script type="module" src="script.js"></script>',
  `<script type="module">${js}</script>`,
);

html = html.replace(new RegExp('src="assets/([^"]+)"', "g"), (_match, filename) => {
  const filePath = path.join(root, "assets", filename);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = imageMimeTypes[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath).toString("base64");
  return `src="data:${mimeType};base64,${data}"`;
});

const server = `const html = ${JSON.stringify(html)};

export default {
  async fetch() {
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
  },
};
`;

fs.writeFileSync(path.join(serverDir, "index.js"), server);
