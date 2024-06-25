module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'eslint:recommended', // Use the recommended rules from eslint
    'plugin:@typescript-eslint/recommended', // Use the recommended rules from @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended', // Add this line
  ],
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    'prettier/prettier': ['error', { singleQuote: true }], // Add this line
  },
  env: {
    node: true, // Enable Node.js global variables and Node.js scoping.
    jest: true, // Enable Jest global variables
  },
};
