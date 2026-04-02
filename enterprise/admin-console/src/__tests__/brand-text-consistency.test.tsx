/**
 * Property 4: 品牌文案一致性 — 属性测试
 *
 * 通过静态源码分析验证 Layout、PortalLayout、Login 组件中：
 * - 不包含旧品牌名称 "OpenClaw Enterprise" 或 "on AgentCore · aws-samples"
 * - 包含新品牌名称 "VSTECS 智能云 Claw 助手"
 *
 * Feature: vstecs-cloudclaw-ui-branding, Property 4: 品牌文案一致性
 * Validates: Requirements 3.5, 3.6, 3.7, 5.6
 *
 * @author RJ.Wang
 * @date 2025-07-14
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// 品牌组件源文件路径（相对于项目根目录）
const COMPONENT_FILES: Record<string, string> = {
  Layout: path.resolve(__dirname, '../components/Layout.tsx'),
  PortalLayout: path.resolve(__dirname, '../components/PortalLayout.tsx'),
  Login: path.resolve(__dirname, '../pages/Login.tsx'),
};

// 旧品牌名称（不应出现在面向用户的文案中）
const OLD_BRAND_STRINGS = [
  'OpenClaw Enterprise',
  'on AgentCore · aws-samples',
];

// 新品牌名称（应出现在组件中）
const NEW_BRAND_STRING = 'VSTECS 智能云 Claw 助手';

// 读取源文件内容的辅助函数
function readComponentSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// Feature: vstecs-cloudclaw-ui-branding, Property 4: 品牌文案一致性
describe('Property 4: 品牌文案一致性', () => {
  const componentNames = Object.keys(COMPONENT_FILES) as Array<keyof typeof COMPONENT_FILES>;

  /**
   * 属性测试：随机选取品牌组件，验证不包含旧品牌名称
   * Validates: Requirements 3.5, 3.6
   */
  it('任意品牌组件的源码中不应包含旧品牌名称作为面向用户的产品名称', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...componentNames),
        fc.constantFrom(...OLD_BRAND_STRINGS),
        (componentName, oldBrandString) => {
          const source = readComponentSource(COMPONENT_FILES[componentName]);
          // 旧品牌字符串不应出现在 JSX 文本内容中（即引号包裹的字符串字面量）
          const inSingleQuotes = source.includes(`'${oldBrandString}'`);
          const inDoubleQuotes = source.includes(`"${oldBrandString}"`);
          const inBackticks = source.includes(`\`${oldBrandString}\``);
          const inJsxText = source.includes(`>${oldBrandString}<`);

          expect(
            inSingleQuotes || inDoubleQuotes || inBackticks || inJsxText,
          ).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 属性测试：随机选取品牌组件，验证包含新品牌名称
   * Validates: Requirements 3.5, 3.7, 5.6
   */
  it('任意品牌组件的源码中应包含新品牌名称 "VSTECS 智能云 Claw 助手"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...componentNames),
        (componentName) => {
          const source = readComponentSource(COMPONENT_FILES[componentName]);
          expect(source).toContain(NEW_BRAND_STRING);
        },
      ),
      { numRuns: 100 },
    );
  });
});
