"use strict";

const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const postcssConfig = require("../postcss.config.js");
const CleanCSS = require("clean-css");

const WATCH = process.argv.includes("--watch");

// Defense in depth: nothing that happens after the initial build
// (a bad CSS edit, a broken import, etc.) should be able to take
// the whole watch process down. Log it and keep watching instead.
process.on("unhandledRejection", error => {
    console.error("✗ Unexpected error (watcher is still running):");
    console.error((error && error.message) || error);
});

// ============================================================
// Paths
// ============================================================
//
// src/css/main.css        → public/css/styles.min.css
// src/css/pages/*.css     → public/css/pages/*.min.css   (optional folder)
//
// Anything imported via @import (from src/css/** or elsewhere)
// is treated as a dependency, never as its own output file.

const SRC_ROOT = path.join(__dirname, "..", "src");
const SRC_CSS_DIR = path.join(SRC_ROOT, "css");
const PAGES_DIR = path.join(SRC_CSS_DIR, "pages");

const PUBLIC_ROOT = path.join(__dirname, "..", "public");
const OUTPUT_DIR = path.join(PUBLIC_ROOT, "css");
const OUTPUT_PAGES_DIR = path.join(OUTPUT_DIR, "pages");

const MAIN_ENTRY_PATH = path.join(SRC_CSS_DIR, "main.css");
const MAIN_OUTPUT_PATH = path.join(OUTPUT_DIR, "styles.min.css");


// ============================================================
// Entry Points
// ============================================================
//
// Returns an array of { source, output, label } objects:
//   - main.css, if it exists
//   - every *.css file directly inside src/pages/, if that folder exists

function getEntryPoints() {
    const entries = [];

    if (fs.existsSync(MAIN_ENTRY_PATH)) {
        entries.push({
            source: canonicalize(MAIN_ENTRY_PATH),
            output: MAIN_OUTPUT_PATH,
            label: "main.css"
        });
    } else {
        console.warn(
            `⚠ No main.css found at ${path.relative(process.cwd(), MAIN_ENTRY_PATH)}`
        );
    }

    if (fs.existsSync(PAGES_DIR)) {
        const pageFiles = fs
            .readdirSync(PAGES_DIR, { withFileTypes: true })
            .filter(entry => entry.isFile() && entry.name.endsWith(".css"));

        for (const file of pageFiles) {
            entries.push({
                source: canonicalize(path.join(PAGES_DIR, file.name)),
                output: path.join(
                    OUTPUT_PAGES_DIR,
                    file.name.replace(/\.css$/, ".min.css")
                ),
                label: `pages/${file.name}`
            });
        }
    }

    return entries;
}


// ============================================================
// Path Normalization
// ============================================================
//
// On Windows/macOS, the filesystem is case-insensitive but JS
// string comparison isn't. If an @import spells a folder as
// "Utilities" while the real folder is "utilities", a naive
// string-keyed dependency graph will never match the two up.
// realpath resolves a path to its actual on-disk casing, so
// every reference to the same file collapses to the same key.

function canonicalize(p) {
    try {
        return fs.realpathSync.native
            ? fs.realpathSync.native(p)
            : fs.realpathSync(p);
    } catch (error) {
        return p;
    }
}


// ============================================================
// Simple Glob Resolution
// ============================================================
//
// Supports single-level wildcard imports like:
//   @import "./utilities/*.css";
// Does NOT support "**" recursive globs — only one "*" per
// path segment, which covers the common "import everything in
// this folder" pattern.
//
// NOTE: this only affects dependency *tracking* for the watcher.
// The actual PostCSS build needs a glob-aware import plugin too —
// plain postcss-import does NOT understand "*" and will fail to
// find "base/*.css" as a literal filename. Use postcss-import-glob
// instead in postcss.config.js:
//
//   npm install -D postcss-import-glob
//
//   module.exports = {
//       plugins: [
//           require("postcss-import-glob").default(),
//           require("autoprefixer")()
//       ]
//   };

function resolveGlobImports(importPath, fromDir) {
    const resolvedPattern = path.resolve(fromDir, importPath);
    const dir = path.dirname(resolvedPattern);
    const base = path.basename(resolvedPattern);

    if (!fs.existsSync(dir)) {
        return [];
    }

    const regexSource =
        "^" +
        base
            .split("*")
            .map(segment => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join(".*") +
        "$";

    const regex = new RegExp(regexSource, "i");

    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isFile() && regex.test(entry.name))
        .map(entry => path.join(dir, entry.name));
}


// ============================================================
// Import Dependency Tracking
// ============================================================
//
// Recursively resolves every local @import found starting from
// a given file, so nested imports (imports-of-imports) are
// discovered too. Handles both literal imports and simple
// wildcard/glob imports (e.g. "./utilities/*.css").

// Matches both quoted and unquoted @import forms:
//   @import url(base/reset.css);
//   @import url("base/reset.css");
//   @import "base/reset.css";
//   @import 'base/reset.css';
// Group 1 captures the url(...) form (quotes inside optional),
// group 2 captures the plain quoted form.
const IMPORT_REGEX =
    /@import\s+(?:url\(\s*["']?([^"')]+)["']?\s*\)|["']([^"']+)["'])/g;

function collectImports(cssText, fromFile, seen = new Set()) {
    const importRegex = new RegExp(IMPORT_REGEX.source, "g");

    let match;

    while ((match = importRegex.exec(cssText)) !== null) {
        const importPath = (match[1] || match[2] || "").trim();

        if (!importPath) {
            continue;
        }

        // Ignore remote imports and data URLs.
        if (/^(https?:)?\/\//.test(importPath) || importPath.startsWith("data:")) {
            continue;
        }

        // Wildcard import: "./utilities/*.css" — resolve every
        // matching file in that folder and recurse into each.
        if (importPath.includes("*")) {
            const globMatches = resolveGlobImports(importPath, path.dirname(fromFile));

            for (const globMatch of globMatches) {
                const resolved = canonicalize(globMatch);

                if (seen.has(resolved)) {
                    continue;
                }

                seen.add(resolved);

                const importedCSS = fs.readFileSync(resolved, "utf8");
                collectImports(importedCSS, resolved, seen);
            }

            continue;
        }

        let resolved = path.resolve(path.dirname(fromFile), importPath);

        // Allow imports without the .css extension.
        if (!fs.existsSync(resolved) && fs.existsSync(`${resolved}.css`)) {
            resolved += ".css";
        }

        if (!fs.existsSync(resolved)) {
            continue;
        }

        resolved = canonicalize(resolved);

        if (seen.has(resolved)) {
            continue;
        }

        seen.add(resolved);

        const importedCSS = fs.readFileSync(resolved, "utf8");

        collectImports(importedCSS, resolved, seen);
    }

    return seen;
}


// ============================================================
// Dependency Graph
// ============================================================
//
// Maps: absolute dependency path → Set of entry "source" paths
// that need rebuilding when that dependency changes.
//
// Example:
//   base/variables.css → { src/css/main.css, src/pages/about.css }

function buildDependencyGraph(entries) {
    const graph = new Map();

    for (const entry of entries) {
        const css = fs.readFileSync(entry.source, "utf8");
        const dependencies = collectImports(css, entry.source);

        // The entry point always depends on itself.
        dependencies.add(entry.source);

        for (const dependency of dependencies) {
            if (!graph.has(dependency)) {
                graph.set(dependency, new Set());
            }
            graph.get(dependency).add(entry.source);
        }
    }

    return graph;
}


// ============================================================
// Build One Entry Point
// ============================================================

async function buildOne(entry) {
    const css = fs.readFileSync(entry.source, "utf8");

    const result = await postcss(postcssConfig.plugins()).process(css, {
        from: entry.source,
        to: entry.output
    });

    // Optimize while keeping the output human-readable
    // (whitespace/comments cleaned up, structure preserved).
    const minified = new CleanCSS({
        level: 1,
        format: "beautify"
    }).minify(result.css);

    if (minified.errors.length) {
        console.error(`✗ Error processing ${entry.label}:`);
        console.error(minified.errors);
        return false;
    }

    fs.mkdirSync(path.dirname(entry.output), { recursive: true });
    fs.writeFileSync(entry.output, minified.styles);

    console.log(`✓ ${entry.label} → ${path.relative(OUTPUT_DIR, entry.output)}`);

    return true;
}


// ============================================================
// Build Everything
// ============================================================

async function buildAll() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const entries = getEntryPoints();

    console.log(`Building ${entries.length} CSS entry point(s)...\n`);

    for (const entry of entries) {
        try {
            await buildOne(entry);
        } catch (error) {
            console.error(`✗ Failed to build ${entry.label}`);
            console.error(error);
        }
    }

    console.log("\nCSS build complete.");

    return entries;
}


// ============================================================
// Watcher
// ============================================================

function watch(initialEntries) {
    let entries = initialEntries;
    let graph = buildDependencyGraph(entries);

    // Quick lookup: source path → entry object.
    const entryBySource = new Map(entries.map(e => [e.source, e]));

    console.log("\nWatching for changes...");
    console.log(`  ${path.relative(process.cwd(), SRC_CSS_DIR)}/`);
    if (fs.existsSync(PAGES_DIR)) {
        console.log(`  ${path.relative(process.cwd(), PAGES_DIR)}/`);
    }
    console.log("Press Ctrl+C to stop.\n");

    const timers = new Map();

    function refreshEntries() {
        entries = getEntryPoints();
        entryBySource.clear();
        for (const e of entries) entryBySource.set(e.source, e);
        graph = buildDependencyGraph(entries);
    }

    async function rebuildEntryBySourcePath(sourcePath) {
        const entry = entryBySource.get(sourcePath);
        if (entry) {
            await buildOne(entry);
        }
    }

    function scheduleBuild(changedPath) {
        if (timers.has(changedPath)) {
            clearTimeout(timers.get(changedPath));
        }

        timers.set(
            changedPath,
            setTimeout(async () => {
                timers.delete(changedPath);

                try {
                    // Rebuild the graph every time so newly added
                    // imports/pages are recognized.
                    refreshEntries();

                    if (!fs.existsSync(changedPath)) {
                        console.log(
                            `- Removed: ${path.relative(SRC_ROOT, changedPath)}`
                        );
                        return;
                    }

                    // Canonicalize so this lookup uses the exact same key
                    // form as the one stored when the graph was built.
                    const canonicalChanged = canonicalize(changedPath);
                    const relLabel = path.relative(SRC_ROOT, changedPath);

                    // Changed file is itself an entry point (main.css or a page).
                    if (entryBySource.has(canonicalChanged)) {
                        console.log(`\n~ ${relLabel} changed`);
                        try {
                            await rebuildEntryBySourcePath(canonicalChanged);
                        } catch (error) {
                            console.error(`✗ Failed to rebuild ${relLabel}`);
                            console.error(error.message || error);
                        }
                        return;
                    }

                    // Changed file is a dependency imported by one or more entries.
                    const affected = graph.get(canonicalChanged);

                    if (affected && affected.size > 0) {
                        console.log(`\n~ ${relLabel} changed`);
                        console.log(
                            `  Rebuilding ${affected.size} dependent entry point(s)...`
                        );

                        for (const sourcePath of affected) {
                            try {
                                await rebuildEntryBySourcePath(sourcePath);
                            } catch (error) {
                                console.error(`✗ Failed to rebuild ${sourcePath}`);
                                console.error(error.message || error);
                            }
                        }
                        return;
                    }

                    console.log(`· Changed (no dependents): ${relLabel}`);
                } catch (error) {
                    // Last-resort safety net: nothing that happens while
                    // handling a file change should ever kill the watcher.
                    console.error("✗ Unexpected error while handling a file change:");
                    console.error(error.message || error);
                }
            }, 100)
        );
    }

    function watchDirectory(directory) {
        if (!fs.existsSync(directory)) return;

        fs.watch(directory, { persistent: true }, (eventType, filename) => {
            if (!filename) return;

            const changedPath = path.join(directory, filename);

            if (fs.existsSync(changedPath) && fs.statSync(changedPath).isDirectory()) {
                watchDirectory(changedPath);
                return;
            }

            if (path.extname(changedPath) !== ".css") return;

            scheduleBuild(changedPath);
        });

        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                watchDirectory(path.join(directory, entry.name));
            }
        }
    }

    // Node's fs.watch supports a native recursive option on Windows
    // and macOS — a single OS-level watch, more reliable than manually
    // wiring up one fs.watch per subdirectory (which is what Linux
    // still falls back to, since it has no native recursive support).
    const supportsNativeRecursive =
        process.platform === "win32" || process.platform === "darwin";

    if (supportsNativeRecursive) {
        fs.watch(
            SRC_CSS_DIR,
            { persistent: true, recursive: true },
            (eventType, filename) => {
                if (!filename) return;

                const changedPath = path.join(SRC_CSS_DIR, filename);

                if (path.extname(changedPath) !== ".css") return;

                scheduleBuild(changedPath);
            }
        );
    } else {
        watchDirectory(SRC_CSS_DIR);
    }
}


// ============================================================
// Start
// ============================================================

(async () => {
    try {
        const entries = await buildAll();

        if (WATCH) {
            watch(entries);
        }
    } catch (error) {
        console.error("\nCSS build failed:");
        console.error(error);
        process.exit(1);
    }
})();