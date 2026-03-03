/**
 * ItemCard Component
 * Redesigned item card with progress bar and expiration indicators
 * 
 * Layout:
 * Row 1: Name + OPEN badge | Edit icon
 * Row 2: Progress bar
 * Row 3: Action buttons (open, eat, cook, trash)
 */

import { 
  getOpenTagColor, 
  getExpirationDays,
  OPEN_TAG_COLORS,
  isEdible,
} from '../utils/categories';
import './ItemCard.css';

// Calculate the estimated expiration date based on when item was opened
const calculateExpirationDate = (openedAt, timeToExpire) => {
  if (!openedAt || !timeToExpire) return null;
  
  const opened = new Date(openedAt);
  const days = getExpirationDays(timeToExpire);
  if (days === Infinity) return null;
  
  const expires = new Date(opened);
  expires.setDate(expires.getDate() + days);
  return expires;
};

// Format date as M/D
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default function ItemCard({ 
  item,
  listItem,
  onOpen,
  onEat,
  onCook,
  onUse,
  onThrow,
  onEdit,
  onSplit,
  onBreakdown,
}) {
  const isOpen = !!listItem.openedAt;
  const itemIsEdible = isEdible(item);
  const usesRemaining = listItem.usesRemaining ?? listItem.quantity ?? 1;
  const totalUses = listItem.usePerUnit ?? item?.usePerUnit ?? 1;
  
  // Progress calculations
  const progressPercent = totalUses > 0 ? (usesRemaining / totalUses) * 100 : 100;
  const progressColor = progressPercent > 66 ? 'green' : progressPercent > 33 ? 'yellow' : 'red';
  
  // Expiration calculations - color based on how far through expiration window
  const timeToExpire = item?.timeToExpire;
  const openTagColor = isOpen ? (getOpenTagColor(listItem.openedAt, timeToExpire) || 'green') : null;
  const estimatedExpiration = calculateExpirationDate(listItem.openedAt, timeToExpire);
  const isExpired = openTagColor === 'black';
  
  // For unopened items, show purchase date
  const purchaseDate = listItem.purchasedAt || listItem.createdAt;
  
  // Simple toggle - just call onOpen
  const handleOpenClick = () => {
    onOpen?.(listItem);
  };
  
  return (
    <div 
      className={`item-card ${isOpen ? 'is-open' : 'is-unopened'} ${isExpired ? 'is-expired' : ''}`}
    >
      {/* Row 1: Name + Badge | Icons */}
      <div className="item-card-row1">
        <div className="item-card-name-status">
          <span className="item-name">
            {item?.name || 'Unknown'}
          </span>
          
          {/* OPEN badge - colored based on expiration progress */}
          {isOpen && (
            <span 
              className={`open-badge open-${openTagColor}`}
              style={{
                borderColor: OPEN_TAG_COLORS[openTagColor]?.border,
                backgroundColor: OPEN_TAG_COLORS[openTagColor]?.background,
                color: OPEN_TAG_COLORS[openTagColor]?.text,
              }}
            >
              OPEN
            </span>
          )}
          
          {/* Expiration info */}
          {isOpen && estimatedExpiration && !isExpired && (
            <span className={`expires-label exp-${openTagColor}`}>
              exp {formatDate(estimatedExpiration)}
            </span>
          )}
          {isExpired && (
            <span className="expired-label">EXPIRED</span>
          )}
          
          {/* Purchase date for unopened */}
          {!isOpen && purchaseDate && (
            <span className="bought-label">
              {formatDate(purchaseDate)}
            </span>
          )}
        </div>
        
        <div className="item-card-icons">
          <button 
            className="icon-btn edit-btn"
            onClick={() => onEdit?.(item)}
            title="Edit item"
          >
            ✏️
          </button>
        </div>
      </div>
      
      {/* Row 2: Progress bar */}
      <div className="item-card-progress">
        <div 
          className={`progress-bar progress-${progressColor}`}
          style={{ width: `${progressPercent}%` }}
        />
        <span className="progress-label">{usesRemaining}/{totalUses}</span>
      </div>
      
      {/* Row 3: Action buttons */}
      <div className="item-card-actions">
        {/* Open button - only shows when NOT open */}
        {!isOpen && (
          <button 
            className="action-btn open-btn"
            onClick={handleOpenClick}
          >
            open
          </button>
        )}
        
        {/* Eat/Cook for edible, Use for non-edible */}
        {itemIsEdible ? (
          <>
            <button 
              className="action-btn eat-btn"
              onClick={() => onEat?.(listItem)}
            >
              eat
            </button>
            <button 
              className="action-btn cook-btn"
              onClick={() => onCook?.(listItem)}
            >
              cook
            </button>
          </>
        ) : (
          <button 
            className="action-btn use-btn"
            onClick={() => onUse?.(listItem)}
          >
            use
          </button>
        )}
        
        {/* Split (for containers) */}
        {onSplit && (
          <button 
            className="action-btn split-btn"
            onClick={() => onSplit(listItem)}
          >
            split
          </button>
        )}
        
        {/* Breakdown (for items that break into parts) */}
        {onBreakdown && (
          <button 
            className="action-btn breakdown-btn"
            onClick={() => onBreakdown(listItem)}
          >
            break down
          </button>
        )}
        
        {/* Trash */}
        <button 
          className="action-btn trash-btn"
          onClick={() => onThrow?.(listItem)}
        >
          trash
        </button>
      </div>
    </div>
  );
}
