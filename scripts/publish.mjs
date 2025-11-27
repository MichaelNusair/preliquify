#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const PACKAGES = [
  "@preliquify/core",
  "@preliquify/preact",
  "@preliquify/compiler",
  "@preliquify/cli",
];

const PACKAGE_PATHS = {
  "@preliquify/core": "packages/core",
  "@preliquify/preact": "packages/preact",
  "@preliquify/compiler": "packages/compiler",
  "@preliquify/cli": "packages/cli",
};

function parseVersion(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  return { major, minor, patch };
}

function bumpPatch(version) {
  const { major, minor, patch } = parseVersion(version);
  return `${major}.${minor}.${patch + 1}`;
}

function readPackageJson(pkgPath) {
  const fullPath = join(rootDir, pkgPath, "package.json");
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function writePackageJson(pkgPath, json) {
  const fullPath = join(rootDir, pkgPath, "package.json");
  writeFileSync(fullPath, JSON.stringify(json, null, 2) + "\n", "utf8");
}

function updateDependencies(pkgJson, newVersion, useWorkspace) {
  const deps = pkgJson.dependencies || {};
  const peerDeps = pkgJson.peerDependencies || {};

  Object.keys(deps).forEach((dep) => {
    if (dep.startsWith("@preliquify/")) {
      deps[dep] = useWorkspace ? "workspace:*" : `^${newVersion}`;
    }
  });

  Object.keys(peerDeps).forEach((dep) => {
    if (dep.startsWith("@preliquify/")) {
      peerDeps[dep] = useWorkspace ? "workspace:*" : `^${newVersion}`;
    }
  });

  pkgJson.dependencies = deps;
  pkgJson.peerDependencies = peerDeps;
}

function getCurrentVersion() {
  const rootPkg = readPackageJson(".");
  return rootPkg.version;
}

function setAllVersions(newVersion, useWorkspace = false) {
  console.log(
    `Setting all package versions to ${newVersion} (${useWorkspace ? "workspace:*" : "^" + newVersion} for deps)`
  );

  // Update root package.json
  const rootPkg = readPackageJson(".");
  rootPkg.version = newVersion;
  writePackageJson(".", rootPkg);

  // Update all package versions
  for (const [pkgName, pkgPath] of Object.entries(PACKAGE_PATHS)) {
    const pkg = readPackageJson(pkgPath);
    pkg.version = newVersion;
    updateDependencies(pkg, newVersion, useWorkspace);
    writePackageJson(pkgPath, pkg);
    console.log(`  ✓ ${pkgName}@${newVersion}`);
  }
}

function build() {
  console.log("\n📦 Building all packages...");
  execSync("pnpm build", { cwd: rootDir, stdio: "inherit" });
}

function publish() {
  console.log("\n🚀 Publishing packages...\n");

  // Publish in dependency order
  for (const pkgName of PACKAGES) {
    const pkgPath = PACKAGE_PATHS[pkgName];
    console.log(`Publishing ${pkgName}...`);
    try {
      execSync("pnpm publish --no-git-checks", {
        cwd: join(rootDir, pkgPath),
        stdio: "inherit",
      });
      console.log(`  ✓ ${pkgName} published\n`);
    } catch (error) {
      console.error(`  ✗ Failed to publish ${pkgName}`);
      throw error;
    }
  }
}

async function main() {
  const currentVersion = getCurrentVersion();
  const newVersion = bumpPatch(currentVersion);

  console.log(`🔄 Bumping versions from ${currentVersion} to ${newVersion}\n`);

  // Step 1: Build first
  build();

  // Step 2: Update to new version with actual version numbers (for publishing)
  setAllVersions(newVersion, false);

  // Step 3: Publish
  publish();

  // Step 4: Restore workspace:* for local development
  console.log("\n🔄 Restoring workspace:* for local development...");
  setAllVersions(newVersion, true);

  console.log(`\n✅ All done! Versions bumped to ${newVersion} and published.`);
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
