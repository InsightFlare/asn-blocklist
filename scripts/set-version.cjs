const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const ROOT = path.join(__dirname, "..");

function exec(command) {
  try {
    return childProcess.execSync(command, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dateIndex = args.indexOf("--date");
  return {
    date: dateIndex >= 0 ? args[dateIndex + 1] : (process.env.RELEASE_DATE || todayUTC()),
  };
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function writeJSON(file, value) {
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
}

function existingVersions(packageName, date) {
  const pattern = new RegExp(`^1\\.${date}\\.(\\d+)$`);
  const versions = [];

  for (const tag of exec(`git tag --list "v1.${date}.*"`).split(/\r?\n/).filter(Boolean)) {
    const match = pattern.exec(tag.replace(/^v/, ""));
    if (match) versions.push(Number(match[1]));
  }

  const npmVersions = exec(`npm view ${packageName} versions --json`);
  if (npmVersions) {
    try {
      const parsed = JSON.parse(npmVersions);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const version of list) {
        const match = pattern.exec(version);
        if (match) versions.push(Number(match[1]));
      }
    } catch {
      // Ignore registry lookup failures. The first publish may not exist yet.
    }
  }

  return versions;
}

function main() {
  const { date } = parseArgs();
  if (!/^\d{8}$/.test(date)) {
    throw new Error(`Release date must be YYYYMMDD, got ${date}`);
  }

  const pkg = readJSON("package.json");
  const patch = Math.max(-1, ...existingVersions(pkg.name, date)) + 1;
  const version = `1.${date}.${patch}`;

  pkg.version = version;
  writeJSON("package.json", pkg);

  const lockPath = path.join(ROOT, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    const lock = readJSON("package-lock.json");
    lock.version = version;
    if (lock.packages && lock.packages[""]) {
      lock.packages[""].version = version;
    }
    writeJSON("package-lock.json", lock);
  }

  console.log(version);
}

main();
