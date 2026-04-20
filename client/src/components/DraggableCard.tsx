import { useRef, useState, useCallback } from 'react';
import type { Card } from '../../../shared/gameTypes';
import PlayingCard from './PlayingCard';

interface DraggableCardProps {
  card: Card;
  playable: boolean;
  selected: boolean;
  highlighted?: boolean;
  isPassThrough?: boolean;
  deckStyle?: 'classic' | 'custom';
  compact?: boolean;
  onClick: () => void;
  /** Called when card is dropped on the battlefield drop zone */
  onDrop?: (card: Card, dropX: number, dropY: number) => boolean;
  /** ID of the battlefield drop zone element */
  dropZoneId?: string;
}

/**
 * DraggableCard — supports both desktop and mobile interaction:
 * - Desktop: pointer down + move > 8px = drag. Release on drop zone = play. Click = select.
 * - Mobile: tap = select/click. Only a SELECTED card can be dragged (long press > 200ms starts drag).
 *   Horizontal swipe on non-selected cards = scroll (no touch-none).
 */
export default function DraggableCard({
  card, playable, selected, highlighted, isPassThrough, deckStyle, compact, onClick, onDrop, dropZoneId = 'battlefield-drop-zone',
}: DraggableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [returning, setReturning] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const origRect = useRef<DOMRect | null>(null);
  const isTouchDevice = useRef(false);
  const dragStarted = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOverDropZone = useCallback((clientX: number, clientY: number) => {
    const dropZone = document.getElementById(dropZoneId);
    if (!dropZone) return false;
    const rect = dropZone.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }, [dropZoneId]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const beginDrag = useCallback((clientX: number, clientY: number) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    origRect.current = rect;
    dragStarted.current = true;
    setDragging(true);
    setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    setDragPos({ x: rect.left, y: rect.top });
  }, []);

  const endDrag = useCallback((clientX: number, clientY: number) => {
    cancelLongPress();
    if (!dragging && !dragStarted.current) return;

    const overDrop = isOverDropZone(clientX, clientY);
    if (overDrop && onDrop) {
      const accepted = onDrop(card, clientX, clientY);
      if (accepted) {
        setDragging(false);
        dragStarted.current = false;
        origRect.current = null;
        return;
      }
    }

    // Return card to original position
    setReturning(true);
    if (origRect.current) {
      setDragPos({ x: origRect.current.left, y: origRect.current.top });
    }
    setTimeout(() => {
      setDragging(false);
      setReturning(false);
      dragStarted.current = false;
      origRect.current = null;
    }, 300);
  }, [dragging, isOverDropZone, onDrop, card, cancelLongPress]);

  // ---- POINTER (desktop) events ----
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!playable || !onDrop) return;
    if (e.pointerType === 'touch') {
      isTouchDevice.current = true;
      return; // Touch is handled by touch events below
    }
    isTouchDevice.current = false;

    const el = cardRef.current;
    if (!el) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    origRect.current = rect;
    startPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragPos({ x: rect.left, y: rect.top });
  }, [playable, onDrop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isTouchDevice.current) return;
    if (!origRect.current || !playable || !onDrop) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!dragging && dist < 8) return;
    if (!dragging) setDragging(true);
    hasMoved.current = true;

    setDragPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  }, [dragging, dragOffset, playable, onDrop]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isTouchDevice.current) return;
    if (!playable) return;

    const el = cardRef.current;
    if (el) { try { el.releasePointerCapture(e.pointerId); } catch {} }

    if (!dragging || !hasMoved.current) {
      setDragging(false);
      startPos.current = { x: 0, y: 0 };
      origRect.current = null;
      if (!hasMoved.current) onClick();
      return;
    }

    endDrag(e.clientX, e.clientY);
  }, [dragging, playable, onClick, endDrag]);

  // ---- TOUCH (mobile) events ----
  // On mobile: tap = click/select. Only selected cards can be dragged.
  // Long press (200ms) on a selected card starts drag.
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!playable || !onDrop) return;
    isTouchDevice.current = true;

    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;

    // Only allow drag on already-selected cards
    if (selected) {
      // Start long press timer — after 200ms, begin drag
      longPressTimer.current = setTimeout(() => {
        beginDrag(touch.clientX, touch.clientY);
        hasMoved.current = true;
      }, 200);
    }
  }, [playable, onDrop, selected, beginDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If moved more than 10px before long press fires, cancel drag and allow scroll
    if (!dragStarted.current && dist > 10) {
      cancelLongPress();
      hasMoved.current = true;
      return;
    }

    // If drag has started, update position and prevent scroll
    if (dragStarted.current && dragging) {
      e.preventDefault();
      setDragPos({ x: touch.clientX - dragOffset.x, y: touch.clientY - dragOffset.y });
    }
  }, [dragging, dragOffset, cancelLongPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice.current) return;
    cancelLongPress();

    if (dragStarted.current && dragging) {
      const touch = e.changedTouches[0];
      endDrag(touch.clientX, touch.clientY);
      return;
    }

    // If no significant movement, treat as tap/click
    if (!hasMoved.current) {
      onClick();
    }
  }, [dragging, cancelLongPress, endDrag, onClick]);

  const handleTouchCancel = useCallback(() => {
    cancelLongPress();
    if (dragStarted.current) {
      setReturning(true);
      if (origRect.current) {
        setDragPos({ x: origRect.current.left, y: origRect.current.top });
      }
      setTimeout(() => {
        setDragging(false);
        setReturning(false);
        dragStarted.current = false;
        origRect.current = null;
      }, 300);
    }
  }, [cancelLongPress]);

  return (
    <>
      <div
        ref={cardRef}
        className={`relative flex-shrink-0 transition-transform duration-150 ${dragging ? 'opacity-30' : ''}`}
        style={{
          transform: dragging ? undefined : selected ? 'translateY(-8px)' : undefined,
          transition: 'transform 0.2s ease',
          // NO touch-none — allow horizontal scroll on mobile
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {!dragging && (
          <PlayingCard
            card={card}
            playable={playable}
            selected={selected}
            highlighted={highlighted}
            deckStyle={deckStyle}
            compact={compact}
            onClick={!onDrop ? onClick : undefined}
          />
        )}
        {dragging && (
          <PlayingCard
            card={card}
            playable={false}
            selected={false}
            deckStyle={deckStyle}
            compact={compact}
            className="opacity-30"
          />
        )}
        {isPassThrough && !selected && !dragging && (
          <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-600 rounded-full flex items-center justify-center border border-yellow-400">
            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
      </div>

      {/* Floating dragged card */}
      {dragging && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            transition: returning ? 'left 0.3s ease-out, top 0.3s ease-out' : 'none',
            transform: 'rotate(-5deg) scale(1.1)',
          }}
        >
          <PlayingCard
            card={card}
            playable={false}
            selected={true}
            deckStyle={deckStyle}
          />
        </div>
      )}
    </>
  );
}
