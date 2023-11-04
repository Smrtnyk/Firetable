module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    parserOptions: {
        ecmaVersion: 2023, // Latest ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        project: './tsconfig.spec.json' // Path to your package's tsconfig.json file
    },
    extends: ["../../.eslintrc.cjs"],
};
