import { FlatCompat } from "@eslint/eslintrc";
import importX from "eslint-plugin-import-x";
import unicorn from "eslint-plugin-unicorn";
import promise from "eslint-plugin-promise";
import { config, configs, parser } from "typescript-eslint";
import eslint from "@eslint/js";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import globals from "globals";
import { join } from "node:path";

const tsconfig = join(import.meta.dirname, "tsconfig.eslint.json");

const compat = new FlatCompat({
    baseDirectory: import.meta.filename,
    resolvePluginsRelativeTo: import.meta.filename,
});

export default config(
    eslint.configs.recommended,
    ...configs.strict,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    promise.configs["flat/recommended"],
    ...compat.plugins("@regru/eslint-plugin-prefer-early-return"),
    {
        settings: {
            "import-x/resolver": {
                typescript: true,
                node: true,
            },
        },
    },
    {
        plugins: {
            promise,
            unicorn,
            vue,
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
                parser,
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
            "unicorn/consistent-existence-index-check": "error",
            "unicorn/prefer-math-min-max": "error",
            "unicorn/prefer-global-this": "error",
            "unicorn/explicit-length-check": "error",
            "unicorn/no-await-in-promise-methods": "error",
            "unicorn/no-console-spaces": "error",
            "unicorn/no-hex-escape": "error",
            "unicorn/no-for-loop": "error",
            "unicorn/no-invalid-fetch-options": "error",
            "unicorn/no-magic-array-flat-depth": "error",
            "unicorn/no-negation-in-equality-check": "error",
            "unicorn/no-invalid-remove-event-listener": "error",
            "unicorn/no-length-as-slice-end": "error",
            "unicorn/no-single-promise-in-promise-methods": "error",
            "unicorn/no-thenable": "error",
            "unicorn/no-typeof-undefined": "error",
            "unicorn/no-unnecessary-polyfills": "error",
            "unicorn/no-unreadable-array-destructuring": "error",
            "unicorn/no-unused-properties": "error",
            "unicorn/no-useless-fallback-in-spread": "error",
            "unicorn/no-zero-fractions": "error",
            "unicorn/number-literal-case": "error",
            "unicorn/numeric-separators-style": "error",
            "unicorn/prefer-add-event-listener": "error",
            "unicorn/prefer-array-find": "error",
            "unicorn/prefer-array-flat": "error",
            "unicorn/prefer-array-flat-map": "error",
            "unicorn/prefer-array-index-of": "error",
            "unicorn/prefer-array-some": "error",
            "unicorn/prefer-json-parse-buffer": "error",
            "unicorn/prefer-logical-operator-over-ternary": "error",
            "unicorn/prefer-math-trunc": "error",
            "unicorn/prefer-native-coercion-functions": "error",
            "unicorn/prefer-negative-index": "error",
            "unicorn/prefer-object-from-entries": "error",
            "unicorn/prefer-prototype-methods": "error",
            "unicorn/prefer-string-raw": "error",
            "unicorn/prefer-string-replace-all": "error",
            "unicorn/prefer-string-starts-ends-with": "error",
            "unicorn/prefer-string-slice": "error",
            "unicorn/prefer-string-trim-start-end": "error",
            "unicorn/prefer-type-error": "error",
            "unicorn/require-array-join-separator": "error",
            "unicorn/better-regex": "error",
            "unicorn/consistent-destructuring": "error",
            "unicorn/consistent-empty-array-spread": "error",
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
            "unicorn/throw-new-error": "error",
            //
            "@regru/prefer-early-return/prefer-early-return": [
                "error",
                {
                    maximumStatements: 2,
                },
            ],
            "linebreak-style": ["error", "unix"],
            // TypeScript
            // "@typescript-eslint/explicit-module-boundary-types": "error",
            "@typescript-eslint/member-ordering": "error",
            "@typescript-eslint/max-params": [
                "error",
                {
                    maximum: 5,
                },
            ],
            "@typescript-eslint/sort-type-constituents": "error",
            "@typescript-eslint/prefer-ts-expect-error": "error",
            "@typescript-eslint/prefer-string-starts-ends-with": "error",
            "@typescript-eslint/prefer-return-this-type": "error",
            "@typescript-eslint/prefer-regexp-exec": "error",
            "@typescript-eslint/prefer-reduce-type-parameter": "error",
            "@typescript-eslint/prefer-readonly": "error",
            "@typescript-eslint/prefer-optional-chain": "error",
            "@typescript-eslint/prefer-literal-enum-member": "error",
            "@typescript-eslint/prefer-includes": "error",
            "@typescript-eslint/prefer-function-type": "error",
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/prefer-find": "error",
            "@typescript-eslint/no-useless-empty-export": "error",
            "@typescript-eslint/prefer-enum-initializers": "error",
            "@typescript-eslint/no-unnecessary-qualifier": "error",
            "@typescript-eslint/no-unnecessary-parameter-property-assignment": "error",
            "@typescript-eslint/no-loop-func": "error",
            "@typescript-eslint/no-invalid-this": "error",
            "@typescript-eslint/no-inferrable-types": "error",
            "@typescript-eslint/no-import-type-side-effects": "error",
            "@typescript-eslint/no-dupe-class-members": "error",
            "@typescript-eslint/no-confusing-non-null-assertion": "error",
            "@typescript-eslint/default-param-last": "error",
            "@typescript-eslint/consistent-type-exports": "error",
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
            "arrow-body-style": ["error", "always"],
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
            "no-confusing-arrow": "error",
            "array-callback-return": "error",
            "for-direction": "error",
            "no-async-promise-executor": "error",
            "no-await-in-loop": "error",
            "no-class-assign": "error",
            "no-constant-binary-expression": "error",
            "no-control-regex": "error",
            "no-dupe-else-if": "error",
            "no-empty-character-class": "error",
            "no-func-assign": "error",
            "no-ex-assign": "error",
            "no-import-assign": "error",
            "no-invalid-regexp": "error",
            "no-irregular-whitespace": "error",
            "no-loss-of-precision": "error",
            "no-misleading-character-class": "error",
            "no-new-native-nonconstructor": "error",
            "no-obj-calls": "error",
            "no-promise-executor-return": "error",
            "no-prototype-builtins": "error",
            "no-self-assign": "error",
            "no-self-compare": "error",
            "no-unexpected-multiline": "error",
            "no-unmodified-loop-condition": "error",
            "no-unreachable-loop": "error",
            "no-unsafe-negation": "error",
            "no-unsafe-optional-chaining": "error",
            "no-useless-backreference": "error",
            "consistent-this": "error",
            "func-name-matching": "error",
            "no-else-return": "error",
            "no-implicit-coercion": "error",
            // "require-atomic-updates": "error",
            "key-spacing": "error",
            "func-style": ["error", "declaration"],
            "grouped-accessor-pairs": "error",
            "id-length": [
                "error",
                {
                    min: 3,
                    exceptions: [
                        "e",
                        "i",
                        "a",
                        "b",
                        "t",
                        "_",
                        "_0",
                        "_1",
                        "x",
                        "y",
                        "n",
                        "id",
                        "db",
                        "ev",
                        "de",
                        "en",
                        "ok",
                        "fn",
                        "to",
                        "on",
                        "rx",
                        "ry",
                        "fs",
                        "$",
                        "ms",
                    ],
                },
            ],
            "max-depth": ["error", 4],
            "max-nested-callbacks": ["error", 3],
            // Kinda overkill
            // "max-lines-per-function": ["error", 40],
            complexity: "error",
            "block-scoped-var": "error",
            "no-case-declarations": "error",
            "no-console": "error",
            "no-array-constructor": "error",
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
            "no-lone-blocks": "error",
            "no-loop-func": "error",
            "no-lonely-if": "error",
            "no-param-reassign": "error",
            "no-return-assign": "error",
            "no-underscore-dangle": [
                "error",
                {
                    allow: ["_doc", "_objects"],
                },
            ],
            "no-unneeded-ternary": "error",
            "no-useless-computed-key": "error",
            "no-useless-concat": "error",
            "no-useless-rename": "error",
            "no-useless-return": "error",
            "object-shorthand": "error",
            "prefer-template": "error",
            "require-await": "error",

            // Classes
            "accessor-pairs": "error",
            "no-constructor-return": "error",
            "no-this-before-super": "error",
            "no-useless-constructor": "error",
            // "new-cap": "error",
            // "class-methods-use-this": "error",

            // Comments
            "no-inline-comments": "error",

            ...vue.configs["vue3-strongly-recommended"].rules,
            "vue/multi-word-component-names": "off",

            "import/no-default-export": "off",
            "import/no-unresolved": "off",
        },
    },
    {
        files: ["**/*.spec.ts"],
        rules: {
            "no-underscore-dangle": "off",
            "func-style": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "unicorn/consistent-function-scoping": "off",
            "unicorn/no-useless-undefined": "off",
            "max-nested-callbacks": "off",
            "no-console": "off",
            "no-await-in-loop": "off",
        },
    },
    {
        files: [
            "**/functions/src/**/*.ts",
            "**/functions/test-helpers/**/*.ts",
            "**/seeds/**/*.ts",
        ],
        rules: {
            "no-await-in-loop": "off",
        },
    },
    {
        files: ["**/functions/test-helpers/**/*.ts", "**/seeds/**/*.ts"],
        rules: {
            "no-console": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
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
            "**/dist-esbuild/**",
            "**/node_modules/**",
            "node_modules",
        ],
    },
);
