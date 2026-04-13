import { useState } from "react";
import { NeonCrownAvatar } from "./NeonCrownAvatar";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, RotateCcw } from "lucide-react";
import { AVATAR_OPTIONS } from "@shared/avatars";

/**
 * AvatarEditorTab — Admin tool to visually adjust avatar image position.
 * Use sliders to tweak offsetX, offsetY, imgScale for any animated avatar.
 * Copy the resulting values to paste into shared/avatars.ts.
 */
export function AvatarEditorTab() {
  const neonCrownOpt = AVATAR_OPTIONS.find(a => a.id === 'neon_crown');

  const [offsetX, setOffsetX] = useState(neonCrownOpt?.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState(neonCrownOpt?.offsetY ?? 0);
  const [imgScale, setImgScale] = useState(neonCrownOpt?.imgScale ?? 1);

  const PREVIEW_SIZES = [32, 48, 64, 96, 128];

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
    <div className="space-y-6 p-4 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-amber-100 mb-1">Редактор аватарок</h2>
        <p className="text-sm text-gray-400">
          Подгоните изображение под круглую рамку аватарки. Скопируйте значения и вставьте в{" "}
          <code className="bg-gray-800 px-1 rounded text-xs">shared/avatars.ts</code>.
        </p>
      </div>

      {/* Avatar selector label */}
      <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Аватарка</div>
        <div className="text-sm font-medium text-amber-100">Неоновая корона (neon_crown)</div>
      </div>

      {/* Preview at multiple sizes */}
      <div>
        <div className="text-xs text-gray-400 mb-3">Превью в разных размерах</div>
        <div className="flex items-end gap-4 flex-wrap">
          {PREVIEW_SIZES.map(s => (
            <div key={s} className="flex flex-col items-center gap-1">
              <NeonCrownAvatar size={s} offsetX={offsetX} offsetY={offsetY} imgScale={imgScale} />
              <span className="text-xs text-gray-500">{s}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-5 bg-gray-800/40 rounded-lg p-4 border border-gray-700">
        {/* offsetX */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-200">Сдвиг по горизонтали (X)</label>
            <span className="text-sm font-mono text-amber-300 w-16 text-right">{offsetX.toFixed(1)}%</span>
          </div>
          <Slider
            min={-50}
            max={50}
            step={0.5}
            value={[offsetX]}
            onValueChange={([v]) => setOffsetX(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>-50% (влево)</span>
            <span>0</span>
            <span>+50% (вправо)</span>
          </div>
        </div>

        {/* offsetY */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-200">Сдвиг по вертикали (Y)</label>
            <span className="text-sm font-mono text-amber-300 w-16 text-right">{offsetY.toFixed(1)}%</span>
          </div>
          <Slider
            min={-50}
            max={50}
            step={0.5}
            value={[offsetY]}
            onValueChange={([v]) => setOffsetY(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>-50% (вверх)</span>
            <span>0</span>
            <span>+50% (вниз)</span>
          </div>
        </div>

        {/* imgScale */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-200">Масштаб</label>
            <span className="text-sm font-mono text-amber-300 w-16 text-right">×{imgScale.toFixed(2)}</span>
          </div>
          <Slider
            min={0.5}
            max={1.5}
            step={0.01}
            value={[imgScale]}
            onValueChange={([v]) => setImgScale(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>×0.5 (меньше)</span>
            <span>×1.0</span>
            <span>×1.5 (больше)</span>
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

      <div className="text-xs text-gray-500 bg-gray-800/40 rounded p-3 border border-gray-700">
        <strong className="text-gray-300">Как применить:</strong> Скопируйте значения выше и вставьте в запись{" "}
        <code className="bg-gray-800 px-1 rounded">neon_crown</code> в файле{" "}
        <code className="bg-gray-800 px-1 rounded">shared/avatars.ts</code>, заменив существующие поля{" "}
        <code className="bg-gray-800 px-1 rounded">offsetX</code>,{" "}
        <code className="bg-gray-800 px-1 rounded">offsetY</code>,{" "}
        <code className="bg-gray-800 px-1 rounded">imgScale</code>.
      </div>
    </div>
  );
}
