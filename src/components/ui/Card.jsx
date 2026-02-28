/**
 * Card Component
 * Container with optional header and footer
 */

import './Card.css';

export function Card({ children, className = '', hoverable = false, ...props }) {
  const classNames = ['card', hoverable && 'card-hoverable', className].filter(Boolean).join(' ');
  
  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
