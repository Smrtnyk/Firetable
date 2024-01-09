module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        project: './tsconfig.json'
    },
    extends: ["../../.eslintrc.cjs"],
};
