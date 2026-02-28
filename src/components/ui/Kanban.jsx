/**
 * Kanban Component
 * Drag cards between columns. Columns are not draggable (future enhancement).
 * For project management, CRM, content pipelines.
 */

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Kanban.css';

/**
 * Sortable card within a column
 */
function KanbanCard({ id, children }) {
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
      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

/**
 * Droppable column
 */
function KanbanColumn({ id, title, items, renderCard }) {
  const { setNodeRef } = useSortable({
    id,
    data: { type: 'column' },
  });

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">{title}</h3>
        <span className="kanban-column-count">{items.length}</span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="kanban-column-content">
          {items.map((item) => (
            <KanbanCard key={item.id} id={item.id}>
              {renderCard ? renderCard(item) : item.title || item.id}
            </KanbanCard>
          ))}
          {items.length === 0 && (
            <div className="kanban-column-empty">Drop items here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Kanban({
  columns,
  onChange,
  renderCard,
  className = '',
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find which column contains an item
  const findColumn = (itemId) => {
    for (const column of columns) {
      if (column.items.some((item) => item.id === itemId)) {
        return column;
      }
    }
    return null;
  };

  // Get item by id
  const getItem = (itemId) => {
    for (const column of columns) {
      const item = column.items.find((i) => i.id === itemId);
      if (item) return item;
    }
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = findColumn(active.id);
    const overColumn = findColumn(over.id) || columns.find((c) => c.id === over.id);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    // Move item to new column
    const newColumns = columns.map((column) => {
      if (column.id === activeColumn.id) {
        return {
          ...column,
          items: column.items.filter((item) => item.id !== active.id),
        };
      }
      if (column.id === overColumn.id) {
        const activeItem = activeColumn.items.find((item) => item.id === active.id);
        const overIndex = column.items.findIndex((item) => item.id === over.id);
        const newItems = [...column.items];
        
        if (overIndex >= 0) {
          newItems.splice(overIndex, 0, activeItem);
        } else {
          newItems.push(activeItem);
        }
        
        return { ...column, items: newItems };
      }
      return column;
    });

    onChange?.(newColumns);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeColumn = findColumn(active.id);
    const overColumn = findColumn(over.id);

    if (!activeColumn || !overColumn) return;

    // Reorder within same column
    if (activeColumn.id === overColumn.id) {
      const oldIndex = activeColumn.items.findIndex((item) => item.id === active.id);
      const newIndex = activeColumn.items.findIndex((item) => item.id === over.id);

      if (oldIndex !== newIndex) {
        const newColumns = columns.map((column) => {
          if (column.id === activeColumn.id) {
            return {
              ...column,
              items: arrayMove(column.items, oldIndex, newIndex),
            };
          }
          return column;
        });
        onChange?.(newColumns);
      }
    }
  };

  const activeItem = activeId ? getItem(activeId) : null;

  return (
    <div className={`kanban ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              items={column.items}
              renderCard={renderCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="kanban-card kanban-card-overlay">
              {renderCard ? renderCard(activeItem) : activeItem.title || activeItem.id}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
