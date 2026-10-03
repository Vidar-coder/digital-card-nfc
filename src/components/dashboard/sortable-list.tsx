"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DragHandleProps {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
}

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (handle: DragHandleProps, dragging: boolean) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10")}
    >
      {children({ attributes, listeners }, isDragging)}
    </div>
  );
}

export function DragHandle({ attributes, listeners, label = "Drag to reorder" }: DragHandleProps & { label?: string }) {
  return (
    <button
      type="button"
      className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing"
      aria-label={label}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

/** Drag-and-drop (mouse, touch and keyboard) reorderable list. */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  children,
  layout = "list",
  className,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, handle: DragHandleProps, dragging: boolean) => ReactNode;
  layout?: "list" | "grid";
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, i) => (
            <SortableItem key={item.id} id={item.id}>
              {(handle, dragging) => children(item, i, handle, dragging)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
