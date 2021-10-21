module.exports = {
    root: true,
    env: {
        es6: true,
    },
    extends: "eslint:recommended",
    parser: "@typescript-eslint/parser",
    parserOptions: {
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "import"],
    rules: {
        "linebreak-style": ["error", "unix"],
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/ban-types": [
            "error",
            {
                types: {
                    "{}": false,
                    Function: false,
                    object: false,
                },
            },
        ],
        "@typescript-eslint/comma-spacing": ["error"],
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/explicit-function-return-type": [
            "warn",
            {
                allowExpressions: true,
            },
        ],
        "@typescript-eslint/func-call-spacing": ["error", "never"],
        "@typescript-eslint/indent": [
            "error",
            4,
            {
                FunctionExpression: {
                    parameters: "first",
                },
                FunctionDeclaration: {
                    parameters: "first",
                },
                SwitchCase: 1,
                flatTernaryExpressions: true,
            },
        ],
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                multiline: {
                    delimiter: "semi",
                    requireLast: true,
                },
                singleline: {
                    delimiter: "comma",
                    requireLast: false,
                },
            },
        ],
        /* "@typescript-eslint/no-explicit-any": ["error", {
            "ignoreRestArgs": true
        }], */
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-magic-numbers": [
            "error",
            {
                ignore: [-1, 0, 1],
                ignoreArrayIndexes: true,
                ignoreEnums: true,
            },
        ],
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
        "@typescript-eslint/quotes": [
            "error",
            "double",
            { allowTemplateLiterals: true },
        ],
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
        "no-shadow": "off",
        // "arrow-body-style": ["error", "always"],
        "arrow-spacing": ["error", { before: true, after: true }],
        "brace-style": "error",
        "comma-dangle": "error",
        "comma-spacing": "off", // Off in the favor of @typescript-eslint/comma-spacing
        "constructor-super": "error",
        curly: "error",
        "eol-last": "error",
        eqeqeq: ["error", "smart"],
        "func-call-spacing": "off", // Off in the favor of @typescript-eslint/func-call-spacing
        "guard-for-in": "error",
        "import/no-default-export": "error",
        "import/order": "off",
        indent: "off", // Off in the favor of @typescript-eslint/indent
        "key-spacing": "error",
        "keyword-spacing": [
            "error",
            {
                before: true,
                after: true,
            },
        ],
        "max-classes-per-file": "off",
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
        "no-case-declarations": "off",
        "no-cond-assign": "error",
        "no-console": "off",
        "no-control-regex": "off",
        "no-debugger": "error",
        "no-dupe-class-members": "off",
        "no-duplicate-case": "error",
        "no-duplicate-imports": "error",
        "no-empty": "off",
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
        "no-prototype-builtins": "off",
        "no-redeclare": "error",
        "no-return-await": "error",
        "no-sequences": "error",
        "no-sparse-arrays": "error",
        "no-tabs": "error",
        "no-template-curly-in-string": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef": "off", // Off in favor of typescript compiler
        "no-undef-init": "error",
        "no-undefined": "error",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "off", // Off in favor of @typescript-eslint/no-unused-expressions
        "no-unused-vars": "off",
        "no-unused-labels": "error",
        "no-useless-escape": "off",
        "no-var": "error",
        "object-curly-spacing": ["error", "always"],
        "one-var": ["error", "never"],
        "prefer-const": "error",
        quotes: "off",
        radix: "error",
        "require-atomic-updates": "off",
        semi: "off",
        "space-before-blocks": "error",
        "space-before-function-paren": "off",
        "space-infix-ops": "error",
        "spaced-comment": ["error", "always", { markers: ["/"] }],
        "use-isnan": "error",
        "valid-typeof": "error",
    },
};
