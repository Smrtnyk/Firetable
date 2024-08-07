import { FlatCompat } from "@eslint/eslintrc";
import importX from "eslint-plugin-import-x";
import unicorn from "eslint-plugin-unicorn";
import promise from "eslint-plugin-promise";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import { join } from "node:path";

const tsconfig = join(import.meta.dirname, "tsconfig.eslint.json");

const compat = new FlatCompat({
    baseDirectory: import.meta.filename,
    resolvePluginsRelativeTo: import.meta.filename,
});

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strict,
    ...compat.plugins("@regru/eslint-plugin-prefer-early-return"),
    {
        plugins: {
            "import-x": importX,
            promise,
            unicorn,
            vue,
        },
    },
    {
        files: ["**/*.vue", "**/*.ts"],
        rules: {
            ...importX.configs.recommended.rules,
            ...importX.configs.typescript.rules,
            ...promise.configs["flat/recommended"].rules,
        },
    },
    {
        files: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.vue"],
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                project: tsconfig,
                tsconfigDirName: import.meta.dirname,
                extraFileExtensions: [".vue"],
            },
            ecmaVersion: "latest",
        },
        rules: {
            // Unicorn
            "unicorn/consistent-function-scoping": [
                "error",
                {
                    checkArrowFunctions: false,
                },
            ],
            "unicorn/explicit-length-check": "error",
            "unicorn/new-for-builtins": "error",
            "unicorn/no-instanceof-array": "error",
            "unicorn/no-lonely-if": "error",
            "unicorn/no-negated-condition": "error",
            "unicorn/no-nested-ternary": "error",
            "unicorn/no-new-array": "error",
            "unicorn/no-static-only-class": "error",
            "unicorn/no-this-assignment": "error",
            "unicorn/no-unnecessary-await": "error",
            "unicorn/no-useless-length-check": "error",
            "unicorn/no-useless-spread": "error",
            "unicorn/no-useless-switch-case": "error",
            "unicorn/no-useless-promise-resolve-reject": "error",
            "unicorn/no-useless-undefined": "error",
            "unicorn/prefer-default-parameters": "error",
            "unicorn/prefer-includes": "error",
            "unicorn/prefer-modern-dom-apis": "error",
            "unicorn/prefer-modern-math-apis": "error",
            "unicorn/prefer-node-protocol": "error",
            "unicorn/prefer-number-properties": "error",
            "unicorn/prefer-ternary": "error",
            "unicorn/throw-new-error": "error",
            //
            "@regru/prefer-early-return/prefer-early-return": [
                "error",
                {
                    maximumStatements: 2,
                },
            ],
            "linebreak-style": ["error", "unix"],
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/adjacent-overload-signatures": "error",
            "@typescript-eslint/no-unsafe-function-type": "error",
            "@typescript-eslint/no-wrapper-object-types": "error",
            "@typescript-eslint/no-empty-object-type": "error",
            "@typescript-eslint/comma-spacing": ["error"],
            "@typescript-eslint/prefer-nullish-coalescing": "error",
            "@typescript-eslint/consistent-type-assertions": "error",
            "@typescript-eslint/explicit-function-return-type": [
                "warn",
                {
                    allowExpressions: true,
                },
            ],
            "@typescript-eslint/func-call-spacing": ["error", "never"],
            "@typescript-eslint/no-empty-function": "warn",
            "@typescript-eslint/no-empty-interface": "error",
            "@typescript-eslint/no-require-imports": "error",
            "@typescript-eslint/no-magic-numbers": "off",
            "@typescript-eslint/no-unused-expressions": ["error"],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "after-used",
                    caughtErrors: "none",
                    vars: "all",
                    argsIgnorePattern: "args",
                },
            ],
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "class",
                    format: ["PascalCase"],
                },
            ],
            "@typescript-eslint/no-var-requires": "error",
            "@typescript-eslint/quotes": ["error", "double", { allowTemplateLiterals: true }],
            "@typescript-eslint/semi": ["error", "always"],
            "@typescript-eslint/space-before-function-paren": [
                "error",
                {
                    anonymous: "always",
                    named: "never",
                    asyncArrow: "always",
                },
            ],
            "@typescript-eslint/type-annotation-spacing": "error",
            "@typescript-eslint/no-shadow": ["error"],
            "@typescript-eslint/unified-signatures": "error",
            "arrow-spacing": ["error", { before: true, after: true }],
            "brace-style": "error",
            "constructor-super": "error",
            curly: ["error", "all"],
            "eol-last": "error",
            eqeqeq: ["error", "smart"],
            "guard-for-in": "error",
            "import-x/no-unresolved": "off",
            "import-x/no-duplicates": "error",
            "import-x/order": [
                "error",
                {
                    groups: [
                        "type",
                        "object",
                        "sibling",
                        "parent",
                        "index",
                        "internal",
                        "external",
                        "builtin",
                    ],
                },
            ],
            "key-spacing": "error",
            "keyword-spacing": [
                "error",
                {
                    before: true,
                    after: true,
                },
            ],
            "max-len": [
                "error",
                {
                    code: 200,
                },
            ],
            "max-statements-per-line": "error",
            "new-parens": "error",
            "no-bitwise": "error",
            "no-caller": "error",
            "no-cond-assign": "error",
            "no-debugger": "error",
            "no-duplicate-case": "error",
            "no-eval": "error",
            "no-extra-bind": "error",
            "no-extra-parens": 0,
            "no-extra-boolean-cast": 2,
            "no-fallthrough": "error",
            "no-inner-declarations": "error",
            "no-multi-spaces": "error",
            "no-multiple-empty-lines": "error",
            "no-new-func": "error",
            "no-new-wrappers": "error",
            "no-redeclare": "error",
            "no-return-await": "error",
            "no-sequences": "error",
            "no-sparse-arrays": "error",
            "no-tabs": "error",
            "no-template-curly-in-string": "error",
            "no-throw-literal": "error",
            "no-trailing-spaces": "error",
            "no-undef-init": "error",
            "no-unsafe-finally": "error",
            "no-unused-labels": "error",
            "no-var": "error",
            "object-curly-spacing": ["error", "always"],
            "one-var": ["error", "never"],
            "prefer-const": "error",
            radix: ["error", "as-needed"],
            "space-before-blocks": "error",
            "space-infix-ops": "error",
            "spaced-comment": ["error", "always", { markers: ["/"] }],
            "use-isnan": "error",
            "valid-typeof": "error",

            ...vue.configs["vue3-strongly-recommended"].rules,
            "vue/multi-word-component-names": "off",

            "import/no-default-export": "off",
            "import/no-unresolved": "off",
        },
    },
    {
        files: ["**/*.spec.ts"],
        rules: {
            "unicorn/consistent-function-scoping": "off",
            "unicorn/no-useless-undefined": "off",
        },
    },
    ...compat.extends("plugin:prettier/recommended"),
    {
        ignores: [
            "**/.quasar/*",
            "**/lib/*",
            "**/dist/",
            "**/temp/",
            "**/coverage/",
            ".idea/",
            "**/vitest.config.ts",
        ],
    },
);
