/**
 * ItemCard Component
 * Redesigned item card with progress bar and expiration indicators
 * 
 * Layout:
 * Row 1: Name | Status (BOUGHT/OPEN + EXPIRES) | Edit/Qty icons
 * Row 2: Progress bar
 * Row 3: Action buttons (open, eat, cook, trash)
 */

import { useState } from 'react';
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
    // Always show confirmation
    setShowOpenConfirm(true);
  };
  
  const confirmOpen = () => {
    setShowOpenConfirm(false);
    onOpen?.(listItem);
  };
  
  // Get border color based on state
  const getBorderColor = () => {
    if (isOpen) {
      return OPEN_TAG_COLORS[openTagColor]?.border || '#28a745';
    }
    return '#444';
  };
  
  return (
    <div 
      className={`item-card ${isOpen ? 'is-open' : 'is-unopened'} ${isExpired ? 'is-expired' : ''}`}
      style={{ borderLeftColor: getBorderColor() }}
    >
      {/* Row 1: Name | Status | Icons */}
      <div className="item-card-row1">
        <div className="item-card-name-status">
          {showName && (
            <span className={`item-name ${isOpen ? 'name-open' : ''}`}>
              {item?.name || 'Unknown'}
            </span>
          )}
          
          <div className="item-status">
            {isOpen ? (
              <>
                <span 
                  className={`open-badge open-${openTagColor}`}
                  style={{
                    borderColor: OPEN_TAG_COLORS[openTagColor]?.border,
                    backgroundColor: OPEN_TAG_COLORS[openTagColor]?.background,
                    color: OPEN_TAG_COLORS[openTagColor]?.text,
                  }}
                >
                  ((OPEN!!)))
                </span>
                {estimatedExpiration && !isExpired && (
                  <span className={`expires-label exp-${openTagColor}`}>
                    EXPIRES {formatDate(estimatedExpiration)}:
                  </span>
                )}
                {isExpired && (
                  <span className="expired-label">💀💀💀 EXPIRED</span>
                )}
              </>
            ) : (
              <span className="bought-label">
                BOUGHT {formatDate(purchaseDate)}:
              </span>
            )}
          </div>
        </div>
        
        <div className="item-card-icons">
          <button 
            className="icon-btn edit-btn"
            onClick={() => onEdit?.(item)}
            title="Edit item"
          >
            ✏️
          </button>
          <span className="qty-badge">×{listItem.quantity || 1}</span>
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
        {/* Open button (only for unopened) */}
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
        
        {/* Trash */}
        <button 
          className="action-btn trash-btn"
          onClick={() => onThrow?.(listItem)}
        >
          trash
        </button>
      </div>
      
      {/* Open Confirmation Modal */}
      {showOpenConfirm && (
        <div className="confirm-overlay" onClick={() => setShowOpenConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Open {item?.name}?</h3>
            {sameItemOpenCount > 0 && (
              <p className="confirm-warning">
                ⚠️ You already have {sameItemOpenCount} open {item?.name}!
              </p>
            )}
            <p>This will start the expiration countdown.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setShowOpenConfirm(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmOpen}>
                Yes, Open It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
