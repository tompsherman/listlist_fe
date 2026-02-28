/**
 * ReorderableGrid Component
 * 2D drag and drop grid. Uniform item sizes, responsive container.
 * For image galleries, dashboard widgets, card collections.
 */

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './ReorderableGrid.css';

/**
 * Sortable grid item
 */
function GridItem({ id, children }) {
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
      className={`grid-item ${isDragging ? 'grid-item-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export default function ReorderableGrid({
  items,
  onChange,
  renderItem,
  columns = 3,
  gap = 'var(--space-3)',
  className = '',
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onChange?.(arrayMove(items, oldIndex, newIndex));
    }
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div
          className={`reorderable-grid ${className}`}
          style={{
            '--grid-columns': columns,
            '--grid-gap': gap,
          }}
        >
          {items.map((item) => (
            <GridItem key={item.id} id={item.id}>
              {renderItem ? renderItem(item) : item.label || item.id}
            </GridItem>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <div className="grid-item grid-item-overlay">
            {renderItem ? renderItem(activeItem) : activeItem.label || activeItem.id}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Re-export arrayMove for external use
export { arrayMove };
