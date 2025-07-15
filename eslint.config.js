import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
	{
		ignores: [
			'.svelte-kit/**',
			'build/**',
			'dist/**',
			'node_modules/**',
			'docs/**',
			'doc-gen/**',
			'jsdoc-template/**',
			'tests/**'
		]
	},
	{
		files: ['scripts/**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly'
			}
		},
		rules: {
			'no-console': 'off',
			'semi': ['error', 'always'],
			'quotes': ['error', 'single'],
			'indent': ['error', 'tab'],
			'no-case-declarations': ['error', 'always'],
		}
	},
	js.configs.recommended,
	{
		files: ['src/**/*.{js,ts}'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module'
			},
			globals: {
				document: 'readonly',
				window: 'readonly',
				Window: 'readonly',
				console: 'readonly',
				HTMLElement: 'readonly',
				HTMLDivElement: 'readonly',
				AudioContext: 'readonly',
				performance: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				localStorage: 'readonly',
				navigator: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint
		},
		rules: {
			// Code Style
			'semi': ['error', 'always'],
			'quotes': ['error', 'single'],
			'indent': ['error', 'tab'],
			'brace-style': ['error', '1tbs'],
			'curly': ['error', 'all'],

			// TypeScript Rules
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/explicit-module-boundary-types': 'error',
			'@typescript-eslint/explicit-member-accessibility': [
				'error',
				{
					accessibility: 'explicit'
				}
			],
			'@typescript-eslint/no-unused-vars': 'warn',

			// Code Quality
			'no-unused-vars': 'off', // Use TypeScript version instead
			'no-console': 'warn',
			'no-debugger': 'warn',

			// Import/Export
			'prefer-const': 'error',
			'no-var': 'error',

			// General Best Practices
			'eqeqeq': ['error', 'always'],
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'prefer-arrow-callback': 'error'
		}
	}
];