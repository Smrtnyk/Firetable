const { resolve } = require("path");

module.exports = {
    // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
    // This option interrupts the configuration hierarchy at this file
    // Remove this if you have an higher level ESLint config file (it usually happens into a monorepos)
    root: true,

    // https://eslint.vuejs.org/user-guide/#how-to-use-custom-parser
    // Must use parserOptions instead of "parser" to allow vue-eslint-parser to keep working
    // `parser: 'vue-eslint-parser'` is already included with any 'plugin:vue/**' config and should be omitted
    parserOptions: {
        // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser#configuration
        // https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#eslint
        // Needed to make the parser take into account 'vue' files
        extraFileExtensions: [".vue"],
        parser: "@typescript-eslint/parser",
        project: resolve(__dirname, "./tsconfig.json"),
        tsconfigRootDir: __dirname,
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: "module", // Allows for the use of imports
        ecmaFeatures: {
            jsx: true,
        },
    },

    env: {
        browser: true,
        "vue/setup-compiler-macros": true,
    },
    globals: {
        ga: "readonly", // Google Analytics
        cordova: "readonly",
        __statics: "readonly",
        __QUASAR_SSR__: "readonly",
        __QUASAR_SSR_SERVER__: "readonly",
        __QUASAR_SSR_CLIENT__: "readonly",
        __QUASAR_SSR_PWA__: "readonly",
        process: "readonly",
        Capacitor: "readonly",
        chrome: "readonly",
    },
    plugins: [
        "@typescript-eslint",
        "promise",
        "prettier",

        // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-file
        // required to lint *.vue files
        "vue",
    ],
    extends: [
        "eslint:recommended",
        "plugin:promise/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:vue/vue3-strongly-recommended",
        "plugin:prettier/recommended",
        "prettier",
    ],
    rules: {
        "import/no-unresolved": "off",
        "import/no-duplicates": "error",
        //
        "linebreak-style": ["error", "unix"],
        "require-await": "error",
        "quasar/check-valid-props": 0,
        "quasar/no-invalid-qfield-usage": 0,
        //
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/explicit-module-boundary-types": 0,
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unused-params": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/quotes": [
            "error",
            "double",
            {
                allowTemplateLiterals: true,
            },
        ],
        "@typescript-eslint/semi": ["error", "always"],
        "@typescript-eslint/ban-ts-comment": "off",
        // VUE 3
        "vue/no-deprecated-filter": 2,
        "vue/require-explicit-emits": 2,
        "vue/no-deprecated-dollar-listeners-api": 2,
        "vue/html-indent": "off",
        "vue/max-attributes-per-line": "off",
        "vue/singleline-html-element-content-newline": "off",
    },
};
