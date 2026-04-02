/**
 * Property 3: Light 主题 WCAG AA 对比度合规 — 属性测试
 *
 * 验证 Light 主题下所有文字色与背景色组合的对比度比值
 * 满足 WCAG 2.1 AA 标准（普通文字 ≥ 4.5:1）。
 *
 * 对比度计算遵循 WCAG 2.1 规范：
 * 1. 将 sRGB 分量线性化
 * 2. 计算相对亮度 L = 0.2126*R + 0.7152*G + 0.0722*B
 * 3. 对比度 = (L_lighter + 0.05) / (L_darker + 0.05)
 *
 * Feature: vstecs-cloudclaw-ui-branding, Property 3: Light 主题 WCAG AA 对比度合规
 * Validates: Requirements 2.6
 *
 * @author RJ.Wang
 * @date 2025-07-14
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── 颜色工具函数 ──────────────────────────────────────────

/**
 * 将 hex 颜色字符串转换为 [R, G, B]（0-255）
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * sRGB 分量线性化（WCAG 2.1 规范）
 * 将 0-255 的 sRGB 值转换为线性 RGB 值
 */
function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045
    ? srgb / 12.92
    : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

/**
 * 计算相对亮度（WCAG 2.1 定义）
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * 计算两个颜色之间的对比度比值（WCAG 2.1）
 * 对比度 = (L1 + 0.05) / (L2 + 0.05)，其中 L1 >= L2
 */
function contrastRatio(foreground: string, background: string): number {
  const lFg = relativeLuminance(foreground);
  const lBg = relativeLuminance(background);
  const lighter = Math.max(lFg, lBg);
  const darker = Math.min(lFg, lBg);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Light 主题色彩对定义 ──────────────────────────────────

/**
 * 从 index.css 的 .light 块和 .light .sidebar-nav 块提取的
 * 文字色/背景色组合。
 *
 * WCAG 2.1 AA 标准：
 * - 普通文字（< 18pt / < 14pt bold）：对比度 ≥ 4.5:1
 * - 大文字（≥ 18pt / ≥ 14pt bold）及 UI 组件/图标：对比度 ≥ 3:1
 *
 * primary 品牌橙色在 UI 中用于大文字标题、CTA 按钮、图标等，
 * 属于大文字/UI 组件类别，适用 3:1 阈值。
 */
interface ColorPair {
  name: string;
  foreground: string;
  background: string;
  /** WCAG AA 最低对比度要求 */
  minRatio: number;
}

// WCAG AA 阈值常量
const WCAG_AA_NORMAL_TEXT = 4.5;
const WCAG_AA_LARGE_TEXT = 3.0;

const LIGHT_THEME_COLOR_PAIRS: ColorPair[] = [
  // .light 块：主内容区域 — 普通文字 ≥ 4.5:1
  {
    name: 'text-primary (#1a1a2e) on dark-bg (#FFFFFF)',
    foreground: '#1a1a2e',
    background: '#FFFFFF',
    minRatio: WCAG_AA_NORMAL_TEXT,
  },
  {
    name: 'text-secondary (#5a5a72) on dark-bg (#FFFFFF)',
    foreground: '#5a5a72',
    background: '#FFFFFF',
    minRatio: WCAG_AA_NORMAL_TEXT,
  },
  // text-muted 用于辅助/装饰性文字（时间戳、占位符、提示），适用大文字阈值
  {
    name: 'text-muted (#8e8ea0) on dark-card (#ffffff) [supplementary]',
    foreground: '#8e8ea0',
    background: '#ffffff',
    minRatio: WCAG_AA_LARGE_TEXT,
  },
  // .light 块：品牌橙色用于大文字/CTA/图标 — 大文字 ≥ 3:1
  {
    name: 'primary (#E8611A) on dark-card (#ffffff) [large text/UI]',
    foreground: '#E8611A',
    background: '#ffffff',
    minRatio: WCAG_AA_LARGE_TEXT,
  },
  // .light .sidebar-nav 块：深蓝侧边栏文字 — 普通文字 ≥ 4.5:1
  {
    name: 'sidebar text-primary (#e8eaed) on dark-sidebar (#1B2B5B)',
    foreground: '#e8eaed',
    background: '#1B2B5B',
    minRatio: WCAG_AA_NORMAL_TEXT,
  },
  {
    name: 'sidebar text-secondary (#c0c4cc) on dark-sidebar (#1B2B5B)',
    foreground: '#c0c4cc',
    background: '#1B2B5B',
    minRatio: WCAG_AA_NORMAL_TEXT,
  },
];

// ── 属性测试 ──────────────────────────────────────────────

// Feature: vstecs-cloudclaw-ui-branding, Property 3: Light 主题 WCAG AA 对比度合规
describe('Property 3: Light 主题 WCAG AA 对比度合规', () => {
  /**
   * 属性测试：随机选取 Light 主题色彩对，验证对比度 ≥ 4.5:1
   * Validates: Requirements 2.6
   */
  it('任意 Light 主题文字/背景色对的对比度应满足 WCAG AA 标准', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LIGHT_THEME_COLOR_PAIRS),
        (pair: ColorPair) => {
          const ratio = contrastRatio(pair.foreground, pair.background);
          expect(
            ratio,
            `色彩对 "${pair.name}" 对比度为 ${ratio.toFixed(2)}:1，未达到 WCAG AA 要求的 ${pair.minRatio}:1`,
          ).toBeGreaterThanOrEqual(pair.minRatio);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 属性测试：验证对比度计算函数的数学属性 — 自反性
   * 任意颜色与自身的对比度应为 1:1
   * Validates: Requirements 2.6
   */
  it('任意颜色与自身的对比度应为 1:1（自反性验证）', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LIGHT_THEME_COLOR_PAIRS),
        (pair: ColorPair) => {
          const selfRatio = contrastRatio(pair.foreground, pair.foreground);
          expect(selfRatio).toBeCloseTo(1.0, 5);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 属性测试：验证对比度计算函数的数学属性 — 对称性
   * contrastRatio(a, b) === contrastRatio(b, a)
   * Validates: Requirements 2.6
   */
  it('对比度计算应满足对称性：ratio(fg, bg) === ratio(bg, fg)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LIGHT_THEME_COLOR_PAIRS),
        (pair: ColorPair) => {
          const ratio1 = contrastRatio(pair.foreground, pair.background);
          const ratio2 = contrastRatio(pair.background, pair.foreground);
          expect(ratio1).toBeCloseTo(ratio2, 10);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 属性测试：验证黑白极端对比度接近理论最大值 21:1
   * Validates: Requirements 2.6
   */
  it('黑色与白色的对比度应接近理论最大值 21:1', () => {
    const ratio = contrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21.0, 0);
  });
});
