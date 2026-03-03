/**
 * ItemCard Component
 * Redesigned item card with progress bar, open/unopened states, and expiration indicators
 * 
 * Features:
 * - Progress bar showing uses remaining (portions)
 * - Lock emoji for unopened items, "open" badge for opened
 * - Color-coded expiration: green > yellow > orange > red > black (expired)
 * - Skull emoji for expiration date, three skulls when expired
 */

import { useState } from 'react';
import { 
  getOpenTagColor, 
  getExpirationColor,
  getExpirationDays,
  OPEN_TAG_COLORS,
  EXPIRATION_BORDER_COLORS,
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
  showName = true,
  allPantryItems = [], // For checking if another of same item is open
}) {
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);
  
  const isOpen = !!listItem.openedAt;
  const itemIsEdible = isEdible(item);
  const usesRemaining = listItem.usesRemaining ?? listItem.quantity ?? 1;
  const totalUses = listItem.usePerUnit ?? item?.usePerUnit ?? 1;
  
  // Progress calculations
  const progressPercent = totalUses > 0 ? (usesRemaining / totalUses) * 100 : 100;
  const progressColor = progressPercent > 66 ? 'green' : progressPercent > 33 ? 'yellow' : 'red';
  
  // Expiration calculations
  const timeToExpire = item?.timeToExpire;
  const openTagColor = getOpenTagColor(listItem.openedAt, timeToExpire);
  const estimatedExpiration = calculateExpirationDate(listItem.openedAt, timeToExpire);
  const isExpired = openTagColor === 'black';
  
  // For unopened items, show purchase date
  const purchaseDate = listItem.purchasedAt || listItem.createdAt;
  
  // Check if another item of same type is already open
  const sameItemOpenCount = allPantryItems.filter(pi => 
    (pi.itemId?._id || pi.itemId) === (item?._id || item) && 
    pi.openedAt && 
    pi._id !== listItem._id
  ).length;
  
  const handleOpenClick = () => {
    if (sameItemOpenCount > 0) {
      setShowOpenConfirm(true);
    } else {
      onOpen?.(listItem);
    }
  };
  
  const confirmOpen = () => {
    setShowOpenConfirm(false);
    onOpen?.(listItem);
  };
  
  return (
    <div 
      className={`item-card ${isOpen ? 'is-open' : 'is-unopened'} ${isExpired ? 'is-expired' : ''}`}
      style={{
        borderLeftColor: isOpen 
          ? (EXPIRATION_BORDER_COLORS[openTagColor] || '#28a745')
          : '#666',
      }}
    >
      {/* Top row: Name + Open badge + Actions */}
      <div className="item-card-header">
        <div className="item-card-title">
          {/* Lock for unopened, nothing for open (badge shows instead) */}
          {!isOpen && <span className="lock-icon">🔒</span>}
          
          {showName && (
            <span className="item-name">{item?.name || 'Unknown'}</span>
          )}
          
          {/* Open badge with color */}
          {isOpen && (
            <span 
              className={`open-badge open-${openTagColor}`}
              style={{
                borderColor: OPEN_TAG_COLORS[openTagColor]?.border,
                backgroundColor: OPEN_TAG_COLORS[openTagColor]?.background,
                color: OPEN_TAG_COLORS[openTagColor]?.text,
              }}
            >
              open
            </span>
          )}
        </div>
        
        <div className="item-card-actions">
          {/* Open button (only for unopened) */}
          {!isOpen && (
            <button 
              className="action-btn open-btn"
              onClick={handleOpenClick}
              title="Mark as opened"
            >
              📦
            </button>
          )}
          
          {/* Eat/Cook for edible, Use for non-edible */}
          {itemIsEdible ? (
            <>
              <button 
                className="action-btn eat-btn"
                onClick={() => onEat?.(listItem)}
                title="Eat one portion"
              >
                🍴
              </button>
              <button 
                className="action-btn cook-btn"
                onClick={() => onCook?.(listItem)}
                title="Use in cooking"
              >
                🍳
              </button>
            </>
          ) : (
            <button 
              className="action-btn use-btn"
              onClick={() => onUse?.(listItem)}
              title="Use one"
            >
              ✓
            </button>
          )}
          
          {/* Edit */}
          <button 
            className="action-btn edit-btn"
            onClick={() => onEdit?.(item)}
            title="Edit item"
          >
            ✏️
          </button>
          
          {/* Throw out */}
          <button 
            className="action-btn throw-btn"
            onClick={() => onThrow?.(listItem)}
            title="Throw out"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Middle row: Progress bar */}
      <div className="item-card-progress">
        <div 
          className={`progress-bar progress-${progressColor}`}
          style={{ width: `${progressPercent}%` }}
        />
        <span className="progress-label">
          {usesRemaining}/{totalUses}
        </span>
      </div>
      
      {/* Bottom row: Date info */}
      <div className="item-card-footer">
        {isOpen ? (
          // Opened: show skull + expiration
          <div className={`expiration-info exp-${openTagColor}`}>
            {isExpired ? (
              // Past expiration: three skulls, no date
              <span className="expired-skulls">💀💀💀</span>
            ) : (
              // Not expired: skull + date
              <>
                <span className="skull-icon">💀</span>
                <span className="exp-date">{formatDate(estimatedExpiration)}</span>
              </>
            )}
          </div>
        ) : (
          // Unopened: show cart + purchase date
          <div className="purchase-info">
            <span className="cart-icon">🛒</span>
            <span className="purchase-date">{formatDate(purchaseDate)}</span>
          </div>
        )}
        
        {/* Quantity badge */}
        <span className="qty-badge">×{listItem.quantity || 1}</span>
      </div>
      
      {/* Open Confirmation Modal */}
      {showOpenConfirm && (
        <div className="confirm-overlay" onClick={() => setShowOpenConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <p className="confirm-warning">
              ⚠️ You already have {sameItemOpenCount} open {item?.name}!
            </p>
            <p>Open another one?</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setShowOpenConfirm(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmOpen}>
                Yes, Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
