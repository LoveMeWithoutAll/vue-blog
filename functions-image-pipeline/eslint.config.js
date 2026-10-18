const js = require('@eslint/js')

module.exports = [js.configs.recommended, {
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'commonjs',
    globals: { Buffer: 'readonly', console: 'readonly', structuredClone: 'readonly' }
  }
}]
