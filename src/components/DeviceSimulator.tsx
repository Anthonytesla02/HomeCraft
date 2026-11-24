import { useState } from 'react';
import {
  BatteryCharging,
  Folder,
  Lock,
  Search,
  Signal,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import type {
  DeviceProfile,
  HomeThemePreset,
  OrganizedLayout,
  ScannedApp,
  SmartFolder,
} from '../core/types';
import { AppIconGlyph } from './AppIconGlyph';

interface DeviceSimulatorProps {
  devices: DeviceProfile[];
  activeDevice: DeviceProfile;
  onSelectDevice: (device: DeviceProfile) => void;
  permissionsReady: boolean;
  hasScanned: boolean;
  activeTheme: HomeThemePreset;
  layout: OrganizedLayout;
  onGrantRequiredFromPhone: () => void;
  onScanFromPhone: () => void;
  onMoveApp: (appId: string, targetFolderId: string) => void;
}

export function DeviceSimulator({
  devices,
  activeDevice,
  onSelectDevice,
  permissionsReady,
  hasScanned,
  activeTheme,
  layout,
  onGrantRequiredFromPhone,
  onScanFromPhone,
  onMoveApp,
}: DeviceSimulatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [launchedMessage, setLaunchedMessage] = useState<string | null>(null);

  const openFolder: SmartFolder | null =
    layout.folders.find((f) => f.id === openFolderId) ?? null;

  const handleLaunchApp = (app: ScannedApp) => {
    setOpenFolderId(null);
    setLaunchedMessage(`Launched ${app.name} (${app.packageName})`);
    window.setTimeout(() => setLaunchedMessage(null), 2200);
  };

  const allApps = [...layout.dockApps, ...layout.folders.flatMap((f) => f.apps)].filter(
    (app, index, arr) => arr.findIndex((x) => x.id === app.id) === index
  );
  const searchResults = searchQuery.trim()
    ? allApps.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <aside aria-label="Interactive Android Device Simulator" className="space-y-4">
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <Smartphone className="w-4 h-4 text-neutral-500" aria-hidden="true" />
            <span>Target Device Preview</span>
          </div>
          <span className="text-xs text-neutral-500 tabular-nums">
            {activeDevice.widthDp}dp · {layout.columns} cols · {activeDevice.androidVersion}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {devices.map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => onSelectDevice(device)}
              className={`px-2.5 py-1.5 text-left rounded-lg text-xs transition-colors border ${
                activeDevice.id === device.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <div className="font-medium truncate">{device.name}</div>
              <div
                className={`text-[11px] truncate ${
                  activeDevice.id === device.id ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {device.oemSkin}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          data-testid="android-device-frame"
          data-device-id={activeDevice.id}
          data-theme-id={activeTheme.id}
          className="relative rounded-[34px] p-2.5 bg-[#16181C] shadow-xl border border-neutral-800 transition-all duration-200"
          style={{
            width: `${activeDevice.frameWidthPx}px`,
            height: `${activeDevice.frameHeightPx}px`,
            maxWidth: '100%',
          }}
        >
          <div
            className="relative w-full h-full rounded-[26px] overflow-hidden flex flex-col"
            style={{ background: activeTheme.fallbackGradient }}
          >
            {permissionsReady && hasScanned && (
              <img
                src={activeTheme.wallpaperUrl}
                alt={`${activeTheme.name} active wallpaper`}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {!permissionsReady || !hasScanned ? (
              <div className="relative z-10 flex-1 bg-[#F7F6F2] text-neutral-900 flex flex-col justify-between p-5">
                <div className="flex items-center justify-between text-[11px] font-medium text-neutral-600 tabular-nums">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3" aria-hidden="true" />
                    <Wifi className="w-3 h-3" aria-hidden="true" />
                    <BatteryCharging className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </div>

                <div className="my-auto bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                    <Lock className="w-5 h-5" aria-hidden="true" />
                  </div>
                  {!permissionsReady ? (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-neutral-900">
                          Allow HomeCraft Permissions
                        </h3>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          HomeCraft needs App Inventory access and Default Home Role to scan packages and reorganize your home screen.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onGrantRequiredFromPhone}
                        className="w-full py-2.5 text-xs font-semibold text-white bg-[#1F4D3E] rounded-xl hover:bg-[#173B2F] transition-colors"
                      >
                        Allow Required Permissions
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-neutral-900">
                          Permissions Accepted
                        </h3>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          Scan installed apps across {activeDevice.oemSkin} to build your smart folders and apply themes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onScanFromPhone}
                        className="w-full py-2.5 text-xs font-semibold text-white bg-[#1F4D3E] rounded-xl hover:bg-[#173B2F] transition-colors"
                      >
                        Scan Device Apps
                      </button>
                    </>
                  )}
                </div>

                <div className="text-center text-[11px] text-neutral-500">
                  {activeDevice.name} · {activeDevice.aspectClass}
                </div>
              </div>
            ) : (
              <div
                className="relative z-10 flex-1 flex flex-col justify-between p-4 overflow-hidden"
                style={{ color: activeTheme.textColor }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-medium tabular-nums">
                    <span>9:41</span>
                    <span className="opacity-80">{activeTheme.name}</span>
                    <div className="flex items-center gap-1.5">
                      <Signal className="w-3 h-3" aria-hidden="true" />
                      <Wifi className="w-3 h-3" aria-hidden="true" />
                      <BatteryCharging className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="relative">
                    <Search
                      className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search apps & folders"
                      aria-label="Search apps inside simulated Android home screen"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border backdrop-blur-md focus:outline-2 focus:outline-emerald-600"
                      style={{
                        backgroundColor: activeTheme.cardSurface,
                        borderColor: activeTheme.cardBorder,
                        color: activeTheme.textColor,
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-3 pr-0.5">
                  {searchQuery.trim() ? (
                    <div
                      className="grid gap-3"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(layout.columns, 4)}, minmax(0, 1fr))`,
                      }}
                    >
                      {searchResults.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => handleLaunchApp(app)}
                          className="flex flex-col items-center gap-1 p-1 rounded-lg hover:opacity-85"
                        >
                          <AppIconGlyph
                            iconKey={app.iconKey}
                            color={app.iconColor}
                            name={app.name}
                            shape={activeTheme.iconShape}
                            size="md"
                          />
                          <span className="text-[10px] font-medium truncate w-full text-center">
                            {app.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : activeTheme.folderStyle === 'minimal' ? (
                    <div className="space-y-2">
                      {layout.folders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => setOpenFolderId(folder.id)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border backdrop-blur-md text-left transition-transform active:scale-[0.99]"
                          style={{
                            backgroundColor: activeTheme.cardSurface,
                            borderColor: activeTheme.cardBorder,
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Folder
                              className="w-4 h-4 shrink-0"
                              style={{ color: activeTheme.accentColor }}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold truncate">{folder.name}</span>
                          </div>
                          <span
                            className="text-[11px] tabular-nums shrink-0"
                            style={{ color: activeTheme.mutedTextColor }}
                          >
                            {folder.apps.length} apps
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`grid gap-2.5 ${
                        activeTheme.folderStyle === 'compact' ? 'grid-cols-3' : 'grid-cols-2'
                      }`}
                    >
                      {layout.folders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => setOpenFolderId(folder.id)}
                          className="p-2.5 rounded-2xl border backdrop-blur-md text-left space-y-2 transition-transform active:scale-[0.98]"
                          style={{
                            backgroundColor: activeTheme.cardSurface,
                            borderColor: activeTheme.cardBorder,
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold truncate">{folder.name}</span>
                            <span
                              className="text-[10px] tabular-nums shrink-0"
                              style={{ color: activeTheme.mutedTextColor }}
                            >
                              {folder.apps.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 w-fit">
                            {folder.apps.slice(0, 4).map((app) => (
                              <AppIconGlyph
                                key={app.id}
                                iconKey={app.iconKey}
                                color={app.iconColor}
                                name={app.name}
                                shape={activeTheme.iconShape}
                                size="sm"
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {activeTheme.dockEnabled && (
                  <div
                    className="rounded-2xl border backdrop-blur-md px-3 py-2.5 flex items-center justify-around"
                    style={{
                      backgroundColor: activeTheme.cardSurface,
                      borderColor: activeTheme.cardBorder,
                    }}
                  >
                    {layout.dockApps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleLaunchApp(app)}
                        aria-label={`Launch ${app.name}`}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <AppIconGlyph
                          iconKey={app.iconKey}
                          color={app.iconColor}
                          name={app.name}
                          shape={activeTheme.iconShape}
                          size="md"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {launchedMessage && (
                  <div
                    role="status"
                    className="absolute bottom-20 left-4 right-4 px-3 py-2 rounded-xl bg-neutral-900/95 text-white text-[11px] font-mono text-center shadow-lg"
                  >
                    {launchedMessage}
                  </div>
                )}

                {openFolder && (
                  <div
                    role="dialog"
                    aria-label={`${openFolder.name} folder`}
                    className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-end p-3"
                  >
                    <div
                      className="w-full rounded-2xl p-4 border space-y-3 max-h-[82%] overflow-y-auto"
                      style={{
                        backgroundColor:
                          activeTheme.surfaceMode === 'dark' ? '#161A20' : '#FFFFFF',
                        borderColor: activeTheme.cardBorder,
                        color: activeTheme.textColor,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold">{openFolder.name}</h3>
                          <p
                            className="text-[11px]"
                            style={{ color: activeTheme.mutedTextColor }}
                          >
                            Tap an app to launch or reassign folder
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenFolderId(null)}
                          aria-label="Close folder"
                          className="p-1.5 rounded-lg hover:bg-black/10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {openFolder.apps.map((app) => (
                          <div key={app.id} className="flex flex-col items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleLaunchApp(app)}
                              className="flex flex-col items-center gap-1 hover:opacity-85"
                            >
                              <AppIconGlyph
                                iconKey={app.iconKey}
                                color={app.iconColor}
                                name={app.name}
                                shape={activeTheme.iconShape}
                                size="md"
                              />
                              <span className="text-[11px] font-medium truncate max-w-[76px]">
                                {app.name}
                              </span>
                            </button>
                            <select
                              aria-label={`Move ${app.name} to another folder`}
                              value={openFolder.id}
                              onChange={(e) => onMoveApp(app.id, e.target.value)}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-300 text-neutral-800 bg-white max-w-[82px]"
                            >
                              {layout.folders.map((target) => (
                                <option key={target.id} value={target.id}>
                                  {target.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
