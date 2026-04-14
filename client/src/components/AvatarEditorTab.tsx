import { useState } from "react";
import { NeonCrownAvatar } from "./NeonCrownAvatar";
import { ObsidianNeonFrame } from "./ObsidianNeonFrame";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, RotateCcw, Camera } from "lucide-react";
import { AVATAR_OPTIONS } from "@shared/avatars";

/**
 * AvatarEditorTab — Admin tool to visually adjust avatar image position.
 * Preview shows the avatar exactly as it appears in the Profile drawer.
 */
export function AvatarEditorTab() {
  const neonCrownOpt = AVATAR_OPTIONS.find(a => a.id === 'neon_crown');

  const [offsetX, setOffsetX] = useState(neonCrownOpt?.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState(neonCrownOpt?.offsetY ?? 0);
  const [imgScale, setImgScale] = useState(neonCrownOpt?.imgScale ?? 1);

  function handleReset() {
    setOffsetX(0);
    setOffsetY(0);
    setImgScale(1);
  }

  function handleCopy() {
    const code = `offsetX: ${offsetX},\n    offsetY: ${offsetY},\n    imgScale: ${imgScale},`;
    navigator.clipboard.writeText(code).then(() => {
      toast.success("Скопировано в буфер обмена");
    });
  }

  return (
    <div className="p-4 max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-amber-100 mb-1">Редактор аватарок</h2>
        <p className="text-sm text-gray-400">
          Подгоните изображение под круглую рамку. Превью показывает аватарку точно как в игре.
        </p>
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
                  <NeonCrownAvatar size={80} offsetX={offsetX} offsetY={offsetY} imgScale={imgScale} />
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
                  <NeonCrownAvatar size={40} offsetX={offsetX} offsetY={offsetY} imgScale={imgScale} />
                </ObsidianNeonFrame>
                <div className="text-xs text-gray-200">Обсидиан — Неоновая эра</div>
              </div>
            </div>
          </div>

          {/* Lobby avatar preview */}
          <div className="text-xs text-gray-400 mt-4 mb-2">В лобби (маленький)</div>
          <div className="flex items-center gap-3 bg-[#0d1117] rounded-lg p-3 border border-gray-800">
            <div className="relative">
              <ObsidianNeonFrame size={40}>
                <NeonCrownAvatar size={40} offsetX={offsetX} offsetY={offsetY} imgScale={imgScale} />
              </ObsidianNeonFrame>
            </div>
            <div>
              <div className="text-sm font-bold text-amber-100">ADMIN</div>
              <div className="text-xs text-gray-500">ID 1</div>
            </div>
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
              <Slider min={-50} max={50} step={0.5} value={[offsetX]} onValueChange={([v]) => setOffsetX(v)} />
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
              <Slider min={-50} max={50} step={0.5} value={[offsetY]} onValueChange={([v]) => setOffsetY(v)} />
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
              <Slider min={0.5} max={1.5} step={0.01} value={[imgScale]} onValueChange={([v]) => setImgScale(v)} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>×0.5 меньше</span><span>×1.0</span><span>×1.5 больше</span>
              </div>
            </div>
          </div>

          {/* Result code */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Значения для shared/avatars.ts</div>
            <pre className="text-sm font-mono text-green-400 leading-relaxed">
{`offsetX: ${offsetX},
offsetY: ${offsetY},
imgScale: ${imgScale},`}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleCopy} className="bg-amber-600 hover:bg-amber-500 text-white gap-2">
              <Copy className="w-4 h-4" />
              Скопировать значения
            </Button>
            <Button onClick={handleReset} variant="outline" className="gap-2 text-gray-300">
              <RotateCcw className="w-4 h-4" />
              Сбросить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
