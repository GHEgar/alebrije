import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
    { ignores: ['dist', 'coverage', 'public/**'] },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                __APP_VERSION__: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        settings: {
            react: { version: 'detect' },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'jsx-a11y': jsxA11y,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.flatConfigs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
            'react-hooks/exhaustive-deps': 'warn',
            'indent': ['error', 4],
            'no-unused-vars': ['error', {
                varsIgnorePattern: '^[A-Z_]',
                argsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
            }],
            'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'max-lines': ['error', {
                'max': 300,
                'skipBlankLines': true,
                'skipComments': true,
            }],
            'quotes': ['error', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': true,
            }],
            'template-curly-spacing': ['error', 'never'],
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        files: ['*.config.js', 'scripts/**/*.js'],
        languageOptions: {
            globals: globals.node,
        },
    },
];
