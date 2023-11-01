/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
    clearMocks: true,

    collectCoverage: true,

    // collectCoverageFrom: undefined,

    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",

    // coveragePathIgnorePatterns: [
    //   "/node_modules/"
    // ],

    // Indicates which provider should be used to instrument code for coverage
    coverageProvider: "v8",

    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: ["text"],

    // Make calling deprecated APIs throw helpful error messages
    errorOnDeprecated: true,
    // A path to a module which exports an async function that is triggered once before all test suites
    // globalSetup: undefined,
    // The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
    maxWorkers: "50%",

    // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
    moduleNameMapper: {
        fabric: "<rootDir>/__mocks__/fabric.ts",
    },

    // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
    // modulePathIgnorePatterns: [],

    // Automatically reset mock state before every test
    resetMocks: true,

    // Reset the module registry before running each individual test
    resetModules: true,

    // A path to a custom resolver
    // resolver: undefined,

    // Automatically restore mock state and implementation before every test
    restoreMocks: true,

    // The root directory that Jest should scan for tests and modules within
    rootDir: ".",

    // A list of paths to directories that Jest should use to search for files in
    roots: ["<rootDir>"],
    // The test environment that will be used for testing
    // testEnvironment: "jest-environment-node",

    // The glob patterns Jest uses to detect test files
    testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: ["/node_modules/"],

    // The regexp pattern or array of patterns that Jest uses to detect test files
    // testRegex: [],

    // A map from regular expressions to paths to transformers
    transform: { "\\.(js|jsx|ts|tsx)$": "@sucrase/jest-plugin" },

    // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
    transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^\\/]+$"],
};
