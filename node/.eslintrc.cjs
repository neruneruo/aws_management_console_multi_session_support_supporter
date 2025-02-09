module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    'jest/globals': true,
    webextensions: true,
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'standard',
    'eslint:recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'prettier',
    'jest',
  ],
  rules: {
    indent: 'off',
    '@typescript-eslint/indent': [
      'error',
      2,
    ],
    semi: 'off',
    '@typescript-eslint/semi': [
      'error',
      'always',
    ],
    // https://eslint.org/docs/rules/array-bracket-newline
    // 配列の先頭のブラケットの後で改行をするか
    //   ⇒ 要素追加時の diff の可読性を考慮して always を設定
    //      ただし、可読性を考慮して minItems: 2 として空や短項目の配列は許容
    'array-bracket-newline': [
      'error',
      { minItems: 2 },
    ],
    // https://eslint.org/docs/rules/array-element-newline
    // 配列の要素単位に改行をするか
    //   ⇒ 要素追加時の diff の可読性を考慮して always を設定
    'array-element-newline': [
      'error',
      'always',
    ],
    // https://eslint.org/docs/rules/object-property-newline
    // オブジェクトの要素単位に改行をするか
    //   ⇒ 要素追加時の diff の可読性を考慮して always を設定
    //      ただし、可読性を考慮して minProperties: 2 として空や短項目のオブジェクトは許容
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: {
          multiline: true,
          minProperties: 2,
        },
        ObjectPattern: { multiline: false },
        ImportDeclaration: 'never',
        ExportDeclaration: {
          multiline: true,
          minProperties: 2,
        },
      },
    ],
    // https://eslint.org/docs/rules/comma-dangle
    // 配列やオブジェクトの最後の要素でカンマを付与するか
    //   ⇒ 要素追加時の diff の可読性やカンマ付与漏れによる構文エラーを考慮して only-multiline を設定
    //      always にすると逆に可読性が下がるので、要素単位に改行するケースのみを対象
    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': [
      'error',
      'always-multiline',
    ],
    'object-curly-spacing': 'off',
    '@typescript-eslint/object-curly-spacing': [
      'error',
      'always',
    ],
    '@typescript-eslint/no-require-imports': 'error',
  },
  ignorePatterns: [
    '!.*.js',
    'bin/*',
  ],
};
