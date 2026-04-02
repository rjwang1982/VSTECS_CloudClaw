/**
 * Property 1: CSS 变量驱动的品牌色一致性 — 属性测试
 *
 * 通过静态源码分析验证 index.css 中：
 * - @theme 块中 --color-primary 为 #E8611A
 * - .light 块中 --color-primary 为 #E8611A
 * - 语义色（success/warning/danger/info）未被修改
 *
 * Feature: vstecs-cloudclaw-ui-branding, Property 1: CSS 变量驱动的品牌色一致性
 * Validates: Requirements 1.1, 1.3, 1.5, 2.4
 *
 * @author RJ.Wang
 * @date 2025-07-14
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// CSS 源文件路径
const CSS_FILE = path.resolve(__dirname, '../index.css');

// 品牌主色
const BRAND_PRIMARY = '#E8611A';

// 主题模式定义
const THEME_MODES = ['@theme', '.light'] as const;
type ThemeMode = (typeof THEME_MODES)[number];

// 语义色期望值（@theme 块 = dark 主题）
const DARK_SEMANTIC_COLORS: Record<string, string> = {
  '--color-success': '#4ade80',
  '--color-warning': '#fbbf24',
  '--color-danger': '#f87171',
  '--color-info': '#60a5fa',
};

// 语义色期望值（.light 块）
const LIGHT_SEMANTIC_COLORS: Record<string, string> = {
  '--color-success': '#16a34a',
  '--color-warning': '#d97706',
  '--color-danger': '#dc2626',
  '--color-info': '#2563eb',
};

// 所有语义色变量名
const SEMANTIC_VAR_NAMES = Object.keys(DARK_SEMANTIC_COLORS);

/**
 * 从 CSS 源码中提取指定块的内容
 * @param source 完整 CSS 源码
 * @param blockSelector 块选择器（如 '@theme' 或 '.light'）
 */
function extractBlock(source: string, blockSelector: string): string {
  const escapedSelector = blockSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedSelector}\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`, 's');
  const match = source.match(regex);
  return match ? match[1] : '';
}

/**
 * 从 CSS 块内容中解析指定变量的值
 * @param blockContent CSS 块内容
 * @param varName CSS 变量名（如 '--color-primary'）
 */
function parseVarValue(blockContent: string, varName: string): string | null {
  const escapedVar = varName.replace(/[-]/g, '\\-');
  const regex = new RegExp(`${escapedVar}\\s*:\\s*([^;]+);`);
  const match = blockContent.match(regex);
  return match ? match[1].trim() : null;
}

// 缓存 CSS 源码和解析结果
let cssSource: string;
let themeBlock: string;
let lightBlock: string;

beforeAll(() => {
  cssSource = fs.readFileSync(CSS_FILE, 'utf-8');
  themeBlock = extractBlock(cssSource, '@theme');
  lightBlock = extractBlock(cssSource, '.light');
});

// Feature: vstecs-cloudclaw-ui-branding, Property 1: CSS 变量驱动的品牌色一致性
describe('Property 1: CSS 变量驱动的品牌色一致性', () => {
  /**
   * 属性测试：随机选取主题模式，验证 --color-primary 为品牌橙色
   * Validates: Requirements 1.1, 1.5
   */
  it('任意主题模式下 --color-primary 应为品牌橙色 #E8611A', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...THEME_MODES),
        (mode: ThemeMode) => {
          const block = mode === '@theme' ? themeBlock : lightBlock;
          const value = parseVarValue(block, '--color-primary');
          expect(value).not.toBeNull();
          expect(value!.toUpperCase()).toBe(BRAND_PRIMARY.toUpperCase());
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 属性测试：随机选取语义色变量和主题模式，验证语义色未被修改
   * Validates: Requirements 1.3, 2.4
   */
  it('任意主题模式下语义色（success/warning/danger/info）应保持原始值不变', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...THEME_MODES),
        fc.constantFrom(...SEMANTIC_VAR_NAMES),
        (mode: ThemeMode, varName: string) => {
          const block = mode === '@theme' ? themeBlock : lightBlock;
          const expectedColors = mode === '@theme' ? DARK_SEMANTIC_COLORS : LIGHT_SEMANTIC_COLORS;
          const value = parseVarValue(block, varName);
          expect(value).not.toBeNull();
          expect(value!.toLowerCase()).toBe(expectedColors[varName].toLowerCase());
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 属性测试：随机选取主题模式和 primary 相关变量，验证均为品牌色系
   * Validates: Requirements 1.1, 1.5, 2.4
   */
  it('@theme 块中 --color-primary 明确为 #E8611A', () => {
    const value = parseVarValue(themeBlock, '--color-primary');
    expect(value).not.toBeNull();
    expect(value!.toUpperCase()).toBe(BRAND_PRIMARY.toUpperCase());
  });

  it('.light 块中 --color-primary 明确为 #E8611A', () => {
    const value = parseVarValue(lightBlock, '--color-primary');
    expect(value).not.toBeNull();
    expect(value!.toUpperCase()).toBe(BRAND_PRIMARY.toUpperCase());
  });
});
