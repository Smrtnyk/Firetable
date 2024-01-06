module.exports = {
    // https://eslint.vuejs.org/user-guide/#how-to-use-custom-parser
    // Must use parserOptions instead of "parser" to allow vue-eslint-parser to keep working
    // `parser: 'vue-eslint-parser'` is already included with any 'plugin:vue/**' config and should be omitted
    parserOptions: {
        parser: require.resolve("@typescript-eslint/parser"),
        extraFileExtensions: [".vue"],
        project: "./tsconfig.lint.json",
    },
    reportUnusedDisableDirectives: true,
    env: {
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
        // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-file
        // required to lint *.vue files
        "vue",
    ],
    extends: [
        "../../.eslintrc.cjs",
        "plugin:vue/vue3-strongly-recommended",
        "plugin:prettier/recommended",
        "prettier",
    ],
    rules: {
        "vue/multi-word-component-names": "off",

        "import/no-default-export": "off",
        "import/no-unresolved": "off"
    },
    ignorePatterns: ["**/dist/*"],
};
