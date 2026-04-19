import { FrameWrapper } from './AvatarWithFrame';
import { AvatarDisplay } from './AvatarDisplay';

interface PlayerAvatarProps {
  /** Идентификатор аватарки (например 'khan', 'wolf', 'neon_cat') */
  avatarId?: string | null;
  /** Идентификатор рамки (например 'fire', 'neon'). Если не задан — рамки нет */
  frameId?: string | null;
  /** Размер в пикселях (ширина и высота). По умолчанию 48 */
  size?: number;
  /** Дополнительные CSS-классы для внешнего контейнера */
  className?: string;
  /** alt-текст для img-аватарок */
  alt?: string;
}

/**
 * Единый компонент отображения аватарки игрока с рамкой (или без).
 *
 * Стандарт использования:
 *   <PlayerAvatar avatarId={player.avatarId} frameId={player.equippedFrame} size={64} />
 *
 * Заменяет паттерн:
 *   <FrameWrapper frameId={...} size={...}>
 *     <AvatarDisplay avatarId={...} size={...} className="w-full h-full" />
 *   </FrameWrapper>
 *
 * Особенности:
 * - Аватарка всегда заполняет круг (className="w-full h-full" передаётся в AvatarDisplay)
 * - Анимированные аватары НЕ обрезаются overflow:hidden (это обрезало бы box-shadow и частицы)
 * - При любом size аватарка масштабируется пропорционально, не съезжая
 */
export function PlayerAvatar({
  avatarId,
  frameId,
  size = 48,
  className = '',
  alt = 'Avatar',
}: PlayerAvatarProps) {
  return (
    <FrameWrapper frameId={frameId} size={size} className={className}>
      <AvatarDisplay avatarId={avatarId} size={size} className="w-full h-full" alt={alt} />
    </FrameWrapper>
  );
}
