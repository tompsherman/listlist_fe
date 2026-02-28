/**
 * Hero Component
 * Marketing section with title, subtitle, and CTA
 */

import './Hero.css';
import Button from './Button';

export default function Hero({
  title,
  subtitle,
  primaryAction,
  primaryLabel = 'Get Started',
  secondaryAction,
  secondaryLabel = 'Learn More',
  align = 'center', // center, left
  className = '',
  children,
}) {
  return (
    <section className={`hero hero-${align} ${className}`}>
      <div className="hero-content">
        {title && <h1 className="hero-title">{title}</h1>}
        {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        {children}
        {(primaryAction || secondaryAction) && (
          <div className="hero-actions">
            {primaryAction && (
              <Button onClick={primaryAction} variant="primary" size="lg">
                {primaryLabel}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction} variant="secondary" size="lg">
                {secondaryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
