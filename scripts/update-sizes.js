const fs = require("node:fs");
const path = require("node:path");

const DIST = path.join(__dirname, "..", "dist");
const README = path.join(__dirname, "..", "README.md");

function formatSize(bytes) {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

function updateSizes() {
  let readme = fs.readFileSync(README, "utf-8");

  const marker = /<!-- SIZE:([\w.]+) -->[^<]*<!-- \/SIZE -->/g;

  readme = readme.replace(marker, (match, filename) => {
    const filepath = path.join(DIST, filename);
    let size;
    try {
      size = fs.statSync(filepath).size;
    } catch {
      size = 0;
    }
    return `<!-- SIZE:${filename} -->${formatSize(size)}<!-- /SIZE -->`;
  });

  fs.writeFileSync(README, readme);
  console.log("README sizes updated.");
}

updateSizes();
