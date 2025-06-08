/* eslint-disable no-console -- we want to log here */
import { default as Table } from "cli-table3";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import r from "tinyrainbow";

import enGB from "../src/i18n/en-GB";

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const FILE_EXTENSIONS = [".vue", ".ts"];
const I18N_KEY_REGEX = /\bt\(["'`]([^"'`]+)["'`]/g;

type TranslationObject = { [key: string]: string | TranslationObject };

async function findUsedKeysInDir(directory: string): Promise<Map<string, string[]>> {
    const usedKeys = new Map<string, string[]>();
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            // eslint-disable-next-line no-await-in-loop -- its fine in tools
            const nestedKeys = await findUsedKeysInDir(fullPath);
            for (const [key, files] of nestedKeys.entries()) {
                const existingFiles = usedKeys.get(key) || [];
                usedKeys.set(key, [...existingFiles, ...files]);
            }
        } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
            // eslint-disable-next-line no-await-in-loop -- its fine in tools
            const content = await readFile(fullPath, "utf-8");
            for (const match of content.matchAll(I18N_KEY_REGEX)) {
                const key = match[1];
                if (key.includes("${")) continue;
                const existingFiles = usedKeys.get(key) || [];
                if (!existingFiles.includes(fullPath)) {
                    usedKeys.set(key, [...existingFiles, fullPath]);
                }
            }
        }
    }
    return usedKeys;
}

function flattenTranslationKeys(obj: TranslationObject, prefix = ""): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                keys = keys.concat(flattenTranslationKeys(value as TranslationObject, newPrefix));
            } else {
                keys.push(newPrefix);
            }
        }
    }
    return keys;
}

async function main(): Promise<void> {
    console.log(r.blue(r.bold("🔍 Starting translation analysis...")));

    let issuesFound = false;
    const translationObject = (enGB as any).default || enGB;

    const definedKeys = flattenTranslationKeys(translationObject);
    const definedKeysSet = new Set(definedKeys);

    const usedKeysMap = await findUsedKeysInDir(SRC_DIR);
    const usedKeysSet = new Set(usedKeysMap.keys());

    const missingKeys = new Map<string, string[]>();
    for (const usedKey of usedKeysSet) {
        if (!definedKeysSet.has(usedKey)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
            missingKeys.set(usedKey, usedKeysMap.get(usedKey)!);
        }
    }

    const unusedKeys: string[] = [];
    for (const definedKey of definedKeysSet) {
        if (!usedKeysSet.has(definedKey)) {
            unusedKeys.push(definedKey);
        }
    }

    console.log(r.bold("\n--- Translation Analysis Report ---"));
    console.log(`
    Defined Keys: ${r.bold(String(definedKeysSet.size))}
    Used Keys:    ${r.bold(String(usedKeysSet.size))}
    `);

    if (missingKeys.size > 0) {
        issuesFound = true;
        console.log(r.red(r.bold(`\n❌ Found ${missingKeys.size} Missing Translations`)));
        console.log(r.dim("   (Used in code but not defined in the translation file)"));

        const table = new Table({
            colWidths: [60, 80],
            head: [r.bold(r.red("Missing Key")), r.bold(r.red("Found In file"))],
            wordWrap: true,
        });

        for (const [key, files] of missingKeys.entries()) {
            const relativePath = path.relative(process.cwd(), files[0]);
            table.push([r.red(key), r.dim(relativePath)]);
        }
        console.log(table.toString());
    }

    if (unusedKeys.length > 0) {
        issuesFound = true;
        console.log(r.yellow(r.bold(`\n🗑️ Found ${unusedKeys.length} Unused Translations`)));
        console.log(r.dim("   (Defined in the translation file but never used in code)"));

        const table = new Table({
            colWidths: [30, 80],
            head: [r.bold(r.yellow("Component/Group")), r.bold(r.yellow("Unused Key"))],
            wordWrap: true,
        });

        const groupedUnused: { [key: string]: string[] } = {};
        for (const key of unusedKeys) {
            const group = key.split(".")[0] || "Global";
            if (!groupedUnused[group]) groupedUnused[group] = [];
            groupedUnused[group].push(key);
        }

        for (const group of Object.keys(groupedUnused)) {
            groupedUnused[group].forEach((key) => {
                table.push([group, r.yellow(key)]);
            });
        }
        console.log(table.toString());
    }

    console.log(r.bold("\n--- End of Report ---\n"));

    if (issuesFound) {
        console.log(
            r.red(r.bold("Analysis finished with issues. Please review the report above.")),
        );
        process.exit(1);
    } else {
        console.log(
            r.green(r.bold("✅ Analysis finished successfully. No translation issues found!")),
        );
    }
}

main().catch((error) => {
    console.error(r.red("An unexpected error occurred during translation analysis:"), error);
    process.exit(1);
});
