/**
 * Skeleton Component
 * Loading placeholder with pulse animation
 */

import './Skeleton.css';

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  ...props
}) {
  const classNames = [
    'skeleton',
    `skeleton-${variant}`,
    className,
  ].filter(Boolean).join(' ');

  const style = {
    width: width,
    height: height,
  };

  return <div className={classNames} style={style} {...props} />;
}

// Preset components for common use cases
export function SkeletonText({ lines = 1, className = '', ...props }) {
  return (
    <div className={`skeleton-text-group ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 && lines > 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className = '', ...props }) {
  const sizes = { sm: 32, md: 40, lg: 56, xl: 80 };
  return (
    <Skeleton
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
      {...props}
    />
  );
}

export function SkeletonCard({ className = '', ...props }) {
  return (
    <div className={`skeleton-card ${className}`} {...props}>
      <Skeleton variant="rectangular" height={160} />
      <div className="skeleton-card-content">
        <Skeleton variant="text" width="60%" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}
