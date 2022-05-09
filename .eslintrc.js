module.exports = {
    root: true,
    // https://eslint.vuejs.org/user-guide/#how-to-use-custom-parser
    // Must use parserOptions instead of "parser" to allow vue-eslint-parser to keep working
    // `parser: 'vue-eslint-parser'` is already included with any 'plugin:vue/**' config and should be omitted
    parserOptions: {
        parser: require.resolve('@typescript-eslint/parser'),
        extraFileExtensions: [ '.vue' ]
    },

    env: {
        browser: true,
        es2021: true,
        node: true,
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
        "plugin:vue/vue3-strongly-recommended",
        "plugin:prettier/recommended",
        "prettier",
    ],
    rules: {
        "no-undef": "off",
        //
        "import/no-unresolved": "off",
        "import/no-duplicates": "error",
        //
        "linebreak-style": ["error", "unix"],
        "require-await": "error",
        //
        "@typescript-eslint/unbound-method": "off",
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
    },
    ignorePatterns: ["**/dist/*"]
};
