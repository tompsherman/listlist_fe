/**
 * SortableList Component
 * Drag to reorder list with 2.5D lift effect.
 * Uses @dnd-kit for drag handling.
 *
 * Pattern: Order held in local state, "Save Order" button appears only when
 * order differs from last saved state. Commit pattern in action.
 */

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './SortableList.css';

/**
 * Individual sortable item
 */
function SortableItem({ id, children, renderItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? 'sortable-item-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {renderItem ? renderItem({ id, isDragging }) : children}
    </div>
  );
}

/**
 * Drag overlay with 2.5D effect
 */
function DragOverlayItem({ children }) {
  return (
    <div className="sortable-item sortable-item-overlay">
      {children}
    </div>
  );
}

export default function SortableList({
  items,
  onChange,
  onSave,
  savedOrder,
  renderItem,
  saving = false,
  className = '',
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check if current order differs from saved order
  const hasChanges = useMemo(() => {
    if (!savedOrder) return false;
    if (items.length !== savedOrder.length) return true;
    return items.some((item, i) => item.id !== savedOrder[i]);
  }, [items, savedOrder]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onChange?.(newItems);
    }
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <div className={`sortable-list ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="sortable-list-items">
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} renderItem={renderItem}>
                {item.label || item.id}
              </SortableItem>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem && (
            <DragOverlayItem>
              {renderItem
                ? renderItem({ id: activeItem.id, isDragging: true })
                : activeItem.label || activeItem.id}
            </DragOverlayItem>
          )}
        </DragOverlay>
      </DndContext>

      {/* Save button - only shows when order has changed */}
      {hasChanges && onSave && (
        <button
          type="button"
          className="sortable-list-save"
          onClick={() => onSave(items.map((item) => item.id))}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Order'}
        </button>
      )}
    </div>
  );
}

// Export arrayMove for external use
export { arrayMove };
