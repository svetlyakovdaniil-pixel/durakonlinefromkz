import React, { useState, useMemo, useEffect } from "react";
import { NeonCrownAvatar } from "./NeonCrownAvatar";
import { NeonPawAvatar } from "./NeonPawAvatar";
import { NeonDinoAvatar } from "./NeonDinoAvatar";
import { NeonCatAvatar } from "./NeonCatAvatar";
import { GreatKhanAvatar } from "./GreatKhanAvatar";
import { KhanAvatar } from "./KhanAvatar";
import { GoldenHordeAvatar } from "./GoldenHordeAvatar";
import { DivingEagleAvatar } from "./DivingEagleAvatar";
import { ToxicStormAvatar } from "./ToxicStormAvatar";
import { GasMaskAvatar } from "./GasMaskAvatar";
import { ObsidianNeonFrame } from "./ObsidianNeonFrame";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, RotateCcw, Camera, Save, CheckCircle, ZapOff } from "lucide-react";
import { AVATAR_OPTIONS } from "@shared/avatars";
import { trpc } from "@/lib/trpc";
import { useAvatarOffsets } from "@/hooks/useAvatarOffsets";

/** All avatars that can be edited (exclude bot) */
const EDITABLE_AVATARS = AVATAR_OPTIONS.filter(a => a.id !== 'bot');

/** Animated avatar IDs that use component-based rendering */
const COMPONENT_AVATAR_IDS = ['neon_crown', 'neon_paw', 'neon_dino', 'neon_cat', 'great_khan', 'khan', 'golden_horde', 'diving_eagle', 'toxic_storm', 'gasmask_amber'];

/**
 * Render an avatar by ID with offset/scale applied.
 * For component-based animated avatars, offsets are passed as props.
 * For image-based avatars, offsets are applied via CSS transform.
 */
function PreviewAvatar({
  avatarId,
  size,
  offsetX,
  offsetY,
  imgScale,
}: {
  avatarId: string;
  size: number;
  offsetX: number;
  offsetY: number;
  imgScale: number;
}) {
  // Wrapper that applies CSS transform to any avatar content
  // offsetX/offsetY are percentages of the avatar size
  const translateX = (offsetX / 100) * size;
  const translateY = (offsetY / 100) * size;

  function withTransform(content: React.ReactNode) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#1a1a2e',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${imgScale})`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  switch (avatarId) {
    case 'neon_crown':
      // neon_crown has its own internal offset system — pass directly
      return <NeonCrownAvatar size={size} offsetX={offsetX} offsetY={offsetY} imgScale={imgScale} />;
    case 'neon_paw':
      return withTransform(<NeonPawAvatar size={size} />);
    case 'neon_dino':
      return withTransform(<NeonDinoAvatar size={size} />);
    case 'neon_cat':
      return withTransform(<NeonCatAvatar size={size} />);
    case 'great_khan':
      return withTransform(<GreatKhanAvatar size={size} />);
    case 'khan':
      return withTransform(<KhanAvatar size={size} />);
    case 'golden_horde':
      return withTransform(<GoldenHordeAvatar size={size} />);
    case 'diving_eagle':
      return withTransform(<DivingEagleAvatar size={size} />);
    case 'toxic_storm':
      return withTransform(<ToxicStormAvatar size={size} />);
    case 'gasmask_amber':
      return withTransform(<GasMaskAvatar size={size} />);
    default: {
      // Image-based avatar — apply offsets via CSS transform
      const opt = AVATAR_OPTIONS.find(a => a.id === avatarId);
      const url = opt?.url ?? '';
      return withTransform(
        <img
          src={url}
          alt={avatarId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      );
    }
  }
}

/**
 * AvatarEditorTab — Admin tool to visually adjust avatar image position.
 * Supports ALL avatars in the game (not just neon_crown).
 * "Применить" saves values to DB via tRPC — applies globally to all players.
 */
export function AvatarEditorTab() {
  const [selectedAvatarId, setSelectedAvatarId] = useState('neon_crown');

  const selectedOpt = useMemo(
    () => AVATAR_OPTIONS.find(a => a.id === selectedAvatarId),
    [selectedAvatarId],
  );

  // Load current values from DB (takes priority over static defaults)
  const { getOffsets, dbOffsets } = useAvatarOffsets();
  const utils = trpc.useUtils();

  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imgScale, setImgScale] = useState(1);
  const [saved, setSaved] = useState(false);

  // When DB offsets load or avatar changes — sync sliders to current DB/static values
  useEffect(() => {
    const vals = getOffsets(selectedAvatarId);
    setOffsetX(vals.offsetX);
    setOffsetY(vals.offsetY);
    setImgScale(vals.imgScale);
    setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAvatarId, dbOffsets]);

  const saveOffsets = trpc.admin.saveAvatarOffsets.useMutation({
    onSuccess: () => {
      setSaved(true);
      // Invalidate the public cache so all clients get updated values
      utils.avatarOffsets.getAll.invalidate();
      toast.success("✅ Сохранено! Изменения применены для всех игроков.");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => {
      toast.error(`Ошибка сохранения: ${err.message}`);
    },
  });

  function handleAvatarChange(newId: string) {
    setSelectedAvatarId(newId);
    setSaved(false);
  }

  function handleReset() {
    // Reset to 0, 0, 1 (factory defaults — removes any DB override)
    setOffsetX(0);
    setOffsetY(0);
    setImgScale(1);
    setSaved(false);
  }

  function handleResetToDb() {
    // Reset to current DB/static values (discard unsaved slider changes)
    const vals = getOffsets(selectedAvatarId);
    setOffsetX(vals.offsetX);
    setOffsetY(vals.offsetY);
    setImgScale(vals.imgScale);
    setSaved(false);
  }

  function handleCopy() {
    const code = `offsetX: ${offsetX},\n    offsetY: ${offsetY},\n    imgScale: ${imgScale},`;
    navigator.clipboard.writeText(code).then(() => {
      toast.success("Скопировано в буфер обмена");
    });
  }

  function handleApply() {
    saveOffsets.mutate({
      avatarId: selectedAvatarId,
      offsetX: Math.round(offsetX * 100) / 100,
      offsetY: Math.round(offsetY * 100) / 100,
      imgScale: Math.round(imgScale * 100) / 100,
    });
  }

  // Check if this avatar uses component-based rendering (offsets only work for image-based or neon_crown)
  const isComponentAvatar = COMPONENT_AVATAR_IDS.includes(selectedAvatarId) && selectedAvatarId !== 'neon_crown';
  const hasDbOverride = dbOffsets.some(o => o.avatarId === selectedAvatarId);

  return (
    <div className="p-4 max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-amber-100 mb-1">Редактор аватарок</h2>
        <p className="text-sm text-gray-400">
          Подгоните изображение под круглую рамку. Нажмите <strong className="text-amber-300">«Применить»</strong> чтобы сохранить в базу данных — изменения применятся для всех игроков.
        </p>
      </div>

      {/* Avatar selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">Выберите аватарку</label>
        <div className="flex items-center gap-3">
          <Select value={selectedAvatarId} onValueChange={handleAvatarChange}>
            <SelectTrigger className="w-full max-w-sm bg-gray-800 border-gray-600 text-gray-100">
              <SelectValue placeholder="Выберите аватарку" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 max-h-72">
              {/* Animated avatars group */}
              <div className="px-2 py-1 text-xs text-gray-500 font-semibold uppercase tracking-wide">Анимированные</div>
              {EDITABLE_AVATARS.filter(a => a.animated).map(a => (
                <SelectItem key={a.id} value={a.id} className="text-gray-100 focus:bg-gray-700">
                  <span className="flex items-center gap-2">
                    <span className="text-purple-400">✦</span>
                    {a.name} <span className="text-gray-500 text-xs">({a.id})</span>
                  </span>
                </SelectItem>
              ))}
              {/* Static avatars group */}
              <div className="px-2 py-1 text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Статичные</div>
              {EDITABLE_AVATARS.filter(a => !a.animated).map(a => (
                <SelectItem key={a.id} value={a.id} className="text-gray-100 focus:bg-gray-700">
                  {a.name} <span className="text-gray-500 text-xs">({a.id})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* DB override indicator */}
          {hasDbOverride && (
            <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-700/40 px-2 py-1 rounded-md whitespace-nowrap">
              📦 Есть в БД
            </span>
          )}
        </div>

        {isComponentAvatar && (
          <p className="text-xs text-blue-400 flex items-center gap-1.5">
            <ZapOff className="w-3 h-3" />
            Эта аватарка анимирована через компонент — смещение X/Y/Scale не влияет на её отображение. Можно сохранить значения в БД для будущего использования.
          </p>
        )}
      </div>

      {/* Two-column layout: profile preview + sliders */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Profile preview (left) ── */}
        <div className="flex-shrink-0 w-full lg:w-64">
          <div className="text-xs text-gray-400 mb-2">Превью — как в игре</div>

          {/* Profile drawer mock */}
          <div className="bg-[#1a1408] rounded-xl border border-amber-900/30 overflow-hidden shadow-xl w-full max-w-[260px]">

            {/* Header */}
            <div className="px-4 py-3 border-b border-amber-900/20">
              <div className="text-base font-bold text-amber-100">Профиль</div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-amber-900/20">
              <div className="flex-1 py-2 text-center text-xs font-medium text-amber-300 border-b-2 border-amber-400">
                Профиль
              </div>
              <div className="flex-1 py-2 text-center text-xs text-gray-500">
                История
              </div>
            </div>

            {/* Avatar card */}
            <div className="mx-3 mt-3 bg-[#251c0e] rounded-lg p-4 border border-amber-900/20 flex flex-col items-center">
              {/* Avatar with frame */}
              <div className="relative mb-3">
                <ObsidianNeonFrame size={80}>
                  <PreviewAvatar
                    avatarId={selectedAvatarId}
                    size={80}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    imgScale={imgScale}
                  />
                </ObsidianNeonFrame>
                {/* Camera icon */}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center border-2 border-[#251c0e]">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-1">Ваш ID</div>
              <div className="text-2xl font-bold text-amber-400"># 1</div>
              <div className="text-xs text-gray-500 text-center mt-1">Дайте друзьям этот ID, чтобы они добавили вас</div>
            </div>

            {/* Name */}
            <div className="mx-3 mt-2 bg-[#251c0e] rounded-lg p-3 border border-amber-900/20">
              <div className="text-xs text-gray-400 mb-1">Имя</div>
              <div className="text-sm font-bold text-gray-100">ADMIN</div>
            </div>

            {/* Frame row */}
            <div className="mx-3 mt-2 mb-3 bg-[#251c0e] rounded-lg p-3 border border-amber-900/20">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-400">Рамка аватарки</div>
                <div className="text-xs text-amber-400">Изменить</div>
              </div>
              <div className="flex items-center gap-3">
                <ObsidianNeonFrame size={40}>
                  <PreviewAvatar
                    avatarId={selectedAvatarId}
                    size={40}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    imgScale={imgScale}
                  />
                </ObsidianNeonFrame>
                <div className="text-xs text-gray-200">
                  {selectedOpt?.name ?? selectedAvatarId}
                </div>
              </div>
            </div>
          </div>

          {/* Lobby avatar preview */}
          <div className="text-xs text-gray-400 mt-4 mb-2">В лобби (маленький)</div>
          <div className="flex items-center gap-3 bg-[#0d1117] rounded-lg p-3 border border-gray-800">
            <div className="relative">
              <ObsidianNeonFrame size={40}>
                <PreviewAvatar
                  avatarId={selectedAvatarId}
                  size={40}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  imgScale={imgScale}
                />
              </ObsidianNeonFrame>
            </div>
            <div>
              <div className="text-sm font-bold text-amber-100">ADMIN</div>
              <div className="text-xs text-gray-500">ID 1</div>
            </div>
          </div>

          {/* Small size preview */}
          <div className="text-xs text-gray-400 mt-4 mb-2">Мини (32px — в чате/игре)</div>
          <div className="flex items-center gap-2 bg-[#0d1117] rounded-lg p-3 border border-gray-800">
            <PreviewAvatar
              avatarId={selectedAvatarId}
              size={32}
              offsetX={offsetX}
              offsetY={offsetY}
              imgScale={imgScale}
            />
            <PreviewAvatar
              avatarId={selectedAvatarId}
              size={24}
              offsetX={offsetX}
              offsetY={offsetY}
              imgScale={imgScale}
            />
            <PreviewAvatar
              avatarId={selectedAvatarId}
              size={16}
              offsetX={offsetX}
              offsetY={offsetY}
              imgScale={imgScale}
            />
            <span className="text-xs text-gray-500 ml-1">32 / 24 / 16px</span>
          </div>
        </div>

        {/* ── Sliders (right) ── */}
        <div className="flex-1 space-y-5">
          <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700 space-y-5">

            {/* offsetX */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-200">Сдвиг по горизонтали (X)</label>
                <span className="text-sm font-mono text-amber-300 w-16 text-right">{offsetX.toFixed(1)}%</span>
              </div>
              <Slider min={-50} max={50} step={0.5} value={[offsetX]} onValueChange={([v]) => { setOffsetX(v); setSaved(false); }} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>← влево</span><span>0</span><span>вправо →</span>
              </div>
            </div>

            {/* offsetY */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-200">Сдвиг по вертикали (Y)</label>
                <span className="text-sm font-mono text-amber-300 w-16 text-right">{offsetY.toFixed(1)}%</span>
              </div>
              <Slider min={-50} max={50} step={0.5} value={[offsetY]} onValueChange={([v]) => { setOffsetY(v); setSaved(false); }} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>↑ вверх</span><span>0</span><span>вниз ↓</span>
              </div>
            </div>

            {/* imgScale */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-200">Масштаб</label>
                <span className="text-sm font-mono text-amber-300 w-16 text-right">×{imgScale.toFixed(2)}</span>
              </div>
              <Slider min={0.5} max={2.0} step={0.01} value={[imgScale]} onValueChange={([v]) => { setImgScale(v); setSaved(false); }} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>×0.5 меньше</span><span>×1.0</span><span>×2.0 больше</span>
              </div>
            </div>
          </div>

          {/* Result code */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Текущие значения для <code className="text-amber-300">{selectedAvatarId}</code></div>
            <pre className="text-sm font-mono text-green-400 leading-relaxed">
{`offsetX: ${offsetX},
offsetY: ${offsetY},
imgScale: ${imgScale},`}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleApply}
              disabled={saveOffsets.isPending || saved}
              className={`gap-2 font-semibold ${saved ? 'bg-green-600 hover:bg-green-600' : 'bg-amber-600 hover:bg-amber-500'} text-white`}
            >
              {saved ? (
                <><CheckCircle className="w-4 h-4" /> Сохранено!</>
              ) : saveOffsets.isPending ? (
                <><Save className="w-4 h-4 animate-pulse" /> Сохраняю...</>
              ) : (
                <><Save className="w-4 h-4" /> Применить</>
              )}
            </Button>
            <Button onClick={handleCopy} variant="outline" className="gap-2 text-gray-300 border-gray-600">
              <Copy className="w-4 h-4" />
              Скопировать
            </Button>
            <Button onClick={handleResetToDb} variant="outline" className="gap-2 text-gray-300 border-gray-600" title="Вернуть к значениям из БД">
              <RotateCcw className="w-4 h-4" />
              Отменить
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="gap-2 text-red-400 border-red-900/50 hover:bg-red-900/20"
              title="Сбросить к 0, 0, 1"
            >
              <ZapOff className="w-4 h-4" />
              Сбросить (0,0,1)
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            «Применить» сохраняет значения в базу данных. Изменения применяются глобально для всех игроков без перезагрузки сервера.
          </p>
        </div>
      </div>
    </div>
  );
}
