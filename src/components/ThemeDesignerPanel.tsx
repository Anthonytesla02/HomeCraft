import { useState } from 'react';
import { ArrowRightLeft, Check, Layers, Lock } from 'lucide-react';
import type {
  FolderStyle,
  HomeThemePreset,
  IconShape,
  SmartFolder,
} from '../core/types';

interface ThemeDesignerPanelProps {
  canDesign: boolean;
  presets: HomeThemePreset[];
  draftTheme: HomeThemePreset;
  appliedThemeId: string;
  folders: SmartFolder[];
  onSelectPreset: (preset: HomeThemePreset) => void;
  onUpdateDraftOption: (patch: Partial<HomeThemePreset>) => void;
  onApplyTheme: () => void;
  onMoveApp: (appId: string, targetFolderId: string) => void;
  onGoToScanner: () => void;
}

export function ThemeDesignerPanel({
  canDesign,
  presets,
  draftTheme,
  appliedThemeId,
  folders,
  onSelectPreset,
  onUpdateDraftOption,
  onApplyTheme,
  onMoveApp,
  onGoToScanner,
}: ThemeDesignerPanelProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id ?? '');
  const [justApplied, setJustApplied] = useState(false);

  if (!canDesign) {
    return (
      <section aria-labelledby="themes-locked-heading" className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h1 id="themes-locked-heading" className="text-xl font-bold text-neutral-900">
            Scan Device Apps Before Designing Themes
          </h1>
          <p className="text-sm text-neutral-600">
            Accept permissions and scan your installed apps first so HomeCraft can generate smart folders for each theme.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToScanner}
          className="px-5 py-2.5 text-sm font-medium text-white bg-[#1F4D3E] rounded-lg hover:bg-[#173B2F] transition-colors whitespace-nowrap"
        >
          Go to App Scanner
        </button>
      </section>
    );
  }

  const activeFolder = folders.find((f) => f.id === selectedFolderId) ?? folders[0];
  const isAppliedMatch = appliedThemeId === draftTheme.id && !justApplied ? true : false;

  const handleApply = () => {
    onApplyTheme();
    setJustApplied(true);
    window.setTimeout(() => setJustApplied(false), 2400);
  };

  return (
    <section aria-labelledby="themes-heading" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[260px]">
          <h1 id="themes-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
            Theme &amp; Folder Designer
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600 max-w-xl">
            Select a curated visual system, tune folder density and icon geometry, and apply it directly to the device home screen.
          </p>
        </div>
        <button
          type="button"
          onClick={handleApply}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1F4D3E] rounded-lg hover:bg-[#173B2F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          {justApplied ? (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              Applied to Home Screen
            </>
          ) : (
            'Apply Design to Home Screen'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {presets.map((preset) => {
          const isSelected = preset.id === draftTheme.id;
          const isActiveOnDevice = preset.id === appliedThemeId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              aria-pressed={isSelected}
              className={`text-left bg-white rounded-xl p-4 transition-all flex items-start gap-4 border ${
                isSelected
                  ? 'border-[#1F4D3E] ring-1 ring-[#1F4D3E]'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div
                className="w-16 h-24 rounded-lg overflow-hidden shrink-0 border border-neutral-200 relative"
                style={{ background: preset.fallbackGradient }}
              >
                <img
                  src={preset.wallpaperUrl}
                  alt={`${preset.name} wallpaper preview`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-neutral-900 truncate">
                    {preset.name}
                  </h2>
                  {isActiveOnDevice && (
                    <span className="text-xs font-medium text-emerald-700 shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                  {preset.subtitle}
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs text-neutral-500">
                  <span className="capitalize">{preset.folderStyle} folders</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{preset.iconShape} icons</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-neutral-900">
              Layout &amp; Geometry Controls
            </h2>
          </div>
          <span className="text-xs text-neutral-500">
            {isAppliedMatch ? 'Synced with active home screen' : 'Previewing live in simulator'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-2">
            <span className="block text-xs font-medium text-neutral-700">Folder Style</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg">
              {(['bento', 'compact', 'minimal'] as FolderStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onUpdateDraftOption({ folderStyle: style })}
                  className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    draftTheme.folderStyle === style
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-neutral-700">Icon Shape</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg">
              {(['squircle', 'circle', 'rounded'] as IconShape[]).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => onUpdateDraftOption({ iconShape: shape })}
                  className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    draftTheme.iconShape === shape
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-neutral-700">Grid &amp; Dock</span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-lg">
              <button
                type="button"
                onClick={() =>
                  onUpdateDraftOption({
                    gridColumnsOffset: draftTheme.gridColumnsOffset === 0 ? 1 : 0,
                  })
                }
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  draftTheme.gridColumnsOffset === 1
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {draftTheme.gridColumnsOffset === 1 ? 'Dense +1' : 'Standard'}
              </button>
              <button
                type="button"
                onClick={() => onUpdateDraftOption({ dockEnabled: !draftTheme.dockEnabled })}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  draftTheme.dockEnabled
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {draftTheme.dockEnabled ? 'Dock On' : 'Dock Off'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Folder Reorganization Editor
            </h2>
            <p className="text-xs text-neutral-500">
              Move apps between smart folders before applying to your device.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  activeFolder?.id === folder.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {folder.name} ({folder.apps.length})
              </button>
            ))}
          </div>
        </div>

        {activeFolder && (
          <ul className="divide-y divide-neutral-100">
            {activeFolder.apps.map((app) => (
              <li
                key={app.id}
                className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-900 truncate">{app.name}</div>
                  <div className="font-mono text-xs text-neutral-500 truncate">{app.packageName}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                  <label htmlFor={`move-${app.id}`} className="sr-only">
                    Move {app.name} to folder
                  </label>
                  <select
                    id={`move-${app.id}`}
                    value={activeFolder.id}
                    onChange={(e) => onMoveApp(app.id, e.target.value)}
                    className="text-xs border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white text-neutral-800 focus:outline-2 focus:outline-emerald-800"
                  >
                    {folders.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
