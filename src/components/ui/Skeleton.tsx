import type { ComponentPropsWithoutRef } from 'react';

type SkeletonProps = ComponentPropsWithoutRef<'div'>;

export default function Skeleton({
  className = '',
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden={props['aria-hidden'] ?? true}
      className={`animate-pulse rounded-[12px] bg-[#E8F0EA] dark:bg-stone-800 ${className}`}
    />
  );
}
