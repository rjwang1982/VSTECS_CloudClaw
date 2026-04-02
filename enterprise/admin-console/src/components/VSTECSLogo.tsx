/**
 * VSTECS Logo 组件 — 替代 ClawForgeLogo，使用品牌图片资源。
 *
 * 变体：
 *   - horizontal: 横版 logo，用于侧边栏
 *   - vertical: 竖版 logo，用于登录页和加载页
 *
 * @author RJ.Wang <wangrenjun@gmail.com>
 * @created 2025-07-15
 */

interface VSTECSLogoProps {
  variant: 'horizontal' | 'vertical';
  size?: number;
  className?: string;
}

const logoSrc: Record<VSTECSLogoProps['variant'], string> = {
  horizontal: '/images/vstecs-logo-horizontal.png',
  vertical: '/images/vstecs-logo-vertical.png',
};

export default function VSTECSLogo({ variant, size = 36, className = '' }: VSTECSLogoProps) {
  const src = logoSrc[variant];
  const style = variant === 'horizontal'
    ? { height: size, width: 'auto' }
    : { height: size, width: 'auto' };

  return (
    <img
      src={src}
      alt="VSTECS"
      style={style}
      className={`inline-block object-contain ${className}`}
    />
  );
}
