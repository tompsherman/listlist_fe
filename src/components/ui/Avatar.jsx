/**
 * Avatar Component
 * Image with fallback initials
 */

import { useState } from 'react';
import './Avatar.css';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  status,
  className = '',
  ...props
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const initials = getInitials(name || alt);

  const classNames = [
    'avatar',
    `avatar-${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="avatar-img"
        />
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}
      {status && <span className={`avatar-status avatar-status-${status}`} />}
    </div>
  );
}
