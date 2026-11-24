import { useMemo, useState } from 'react';
import {
  canScanApps,
  categorizePackage,
  moveAppBetweenFolders,
  organizeAppsIntoFolders,
} from './core/organizerEngine';
import type {
  AndroidPermissionId,
  HomeThemePreset,
  PermissionItem,
  ScannedApp,
  SmartFolder,
} from './core/types';
import {
  DEVICE_PROFILES,
  INITIAL_PERMISSIONS,
  SCANNED_APP_CATALOG,
  THEME_PRESETS,
} from './data/androidSeedData';
import { CodemagicPanel } from './components/CodemagicPanel';
import { DeviceSimulator } from './components/DeviceSimulator';
import { PermissionsPanel } from './components/PermissionsPanel';
import { ScannerPanel } from './components/ScannerPanel';
import { ThemeDesignerPanel } from './components/ThemeDesignerPanel';

type StudioTab = 'permissions' | 'scanner' | 'themes' | 'codemagic';

function getInitialAutostart(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('autostart') === '1';
}

export default function App() {
  const autostart = getInitialAutostart();

  const [activeTab, setActiveTab] = useState<StudioTab>(
    autostart ? 'themes' : 'permissions'
  );
  const [permissions, setPermissions] = useState<PermissionItem[]>(() =>
    autostart
      ? INITIAL_PERMISSIONS.map((p) => ({ ...p, granted: true }))
      : INITIAL_PERMISSIONS
  );
  const [hasScanned, setHasScanned] = useState<boolean>(autostart);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [apps, setApps] = useState<ScannedApp[]>(() =>
    autostart ? SCANNED_APP_CATALOG : []
  );

  const [activeDevice, setActiveDevice] = useState(DEVICE_PROFILES[0]);
  const [draftTheme, setDraftTheme] = useState<HomeThemePreset>(THEME_PRESETS[0]);
  const [appliedTheme, setAppliedTheme] = useState<HomeThemePreset>(THEME_PRESETS[0]);
  const [customFolders, setCustomFolders] = useState<SmartFolder[] | null>(null);

  const permissionGate = useMemo(() => canScanApps(permissions), [permissions]);
  const useUsageRanking = useMemo(
    () => permissions.find((p) => p.id === 'PACKAGE_USAGE_STATS')?.granted ?? false,
    [permissions]
  );

  const computedLayout = useMemo(() => {
    const baseLayout = organizeAppsIntoFolders(
      apps,
      draftTheme,
      activeDevice,
      useUsageRanking
    );
    if (customFolders && customFolders.length > 0) {
      return {
        ...baseLayout,
        folders: customFolders,
      };
    }
    return baseLayout;
  }, [apps, draftTheme, activeDevice, useUsageRanking, customFolders]);

  const handleTogglePermission = (id: AndroidPermissionId) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, granted: !p.granted } : p))
    );
  };

  const handleGrantAllRequired = () => {
    setPermissions((prev) =>
      prev.map((p) => (p.required ? { ...p, granted: true } : p))
    );
  };

  const handleGrantAll = () => {
    setPermissions((prev) => prev.map((p) => ({ ...p, granted: true })));
  };

  const handleRunScan = () => {
    if (!permissionGate.allowed) return;
    setIsScanning(true);
    window.setTimeout(() => {
      setApps(SCANNED_APP_CATALOG);
      setCustomFolders(null);
      setHasScanned(true);
      setIsScanning(false);
    }, 350);
  };

  const handleAddCustomApp = (name: string, packageName: string) => {
    const category = categorizePackage(packageName, name);
    const created: ScannedApp = {
      id: `custom-${Date.now()}`,
      name,
      packageName,
      category,
      usageScore: 76,
      iconColor: '#1F4D3E',
      iconKey: 'folder-open',
      isSystemApp: false,
    };
    setApps((prev) => [created, ...prev]);
    setCustomFolders(null);
  };

  const handleSelectPreset = (preset: HomeThemePreset) => {
    setDraftTheme(preset);
  };

  const handleUpdateDraftOption = (patch: Partial<HomeThemePreset>) => {
    setDraftTheme((prev) => ({ ...prev, ...patch }));
  };

  const handleApplyTheme = () => {
    setAppliedTheme(draftTheme);
  };

  const handleMoveApp = (appId: string, targetFolderId: string) => {
    setCustomFolders(moveAppBetweenFolders(computedLayout.folders, appId, targetFolderId));
  };

  const handleDownloadZip = () => {
    const link = document.createElement('a');
    link.href = '/api/export-android-zip';
    link.download = 'HomeCraft-Android-Organizer.zip';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const navItems: Array<{ id: StudioTab; label: string }> = [
    { id: 'permissions', label: 'Permissions' },
    { id: 'scanner', label: 'App Scanner' },
    { id: 'themes', label: 'Theme Designer' },
    { id: 'codemagic', label: 'Codemagic APK' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F1] text-neutral-900">
      <header className="sticky top-0 z-30 bg-[#F6F5F1]/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="max-w-[1320px] mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('permissions');
            }}
            className="font-display text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0"
          >
            HomeCraft
          </a>

          <nav aria-label="Workspace sections" className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`text-sm font-medium pb-0.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-neutral-900 border-[#1F4D3E]'
                      : 'text-neutral-600 border-transparent hover:text-neutral-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleDownloadZip}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1F4D3E] rounded-lg hover:bg-[#173B2F] transition-colors whitespace-nowrap shrink-0"
            >
              Download APK Repo
            </button>
          </div>
        </div>

        <div className="md:hidden border-t border-neutral-200 px-3 py-1.5 grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const mobileLabel =
              item.id === 'scanner'
                ? 'Scanner'
                : item.id === 'themes'
                  ? 'Themes'
                  : item.id === 'codemagic'
                    ? 'Build APK'
                    : 'Permissions';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-2 py-2 text-[11px] font-medium rounded-md text-center truncate ${
                  activeTab === item.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-200/60'
                }`}
              >
                {mobileLabel}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8">
            {activeTab === 'permissions' && (
              <PermissionsPanel
                permissions={permissions}
                allRequiredGranted={permissionGate.allowed}
                onTogglePermission={handleTogglePermission}
                onGrantAllRequired={handleGrantAllRequired}
                onGrantAll={handleGrantAll}
                onProceedToScan={() => setActiveTab('scanner')}
              />
            )}

            {activeTab === 'scanner' && (
              <ScannerPanel
                canScan={permissionGate.allowed}
                hasScanned={hasScanned}
                isScanning={isScanning}
                apps={apps}
                onRunScan={handleRunScan}
                onAddCustomApp={handleAddCustomApp}
                onGoToPermissions={() => setActiveTab('permissions')}
                onProceedToThemes={() => setActiveTab('themes')}
              />
            )}

            {activeTab === 'themes' && (
              <ThemeDesignerPanel
                canDesign={permissionGate.allowed && hasScanned}
                presets={THEME_PRESETS}
                draftTheme={draftTheme}
                appliedThemeId={appliedTheme.id}
                folders={computedLayout.folders}
                onSelectPreset={handleSelectPreset}
                onUpdateDraftOption={handleUpdateDraftOption}
                onApplyTheme={handleApplyTheme}
                onMoveApp={handleMoveApp}
                onGoToScanner={() => setActiveTab('scanner')}
              />
            )}

            {activeTab === 'codemagic' && (
              <CodemagicPanel onDownloadZip={handleDownloadZip} />
            )}
          </div>

          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
            <DeviceSimulator
              devices={DEVICE_PROFILES}
              activeDevice={activeDevice}
              onSelectDevice={setActiveDevice}
              permissionsReady={permissionGate.allowed}
              hasScanned={hasScanned}
              activeTheme={draftTheme}
              layout={computedLayout}
              onGrantRequiredFromPhone={() => {
                handleGrantAllRequired();
              }}
              onScanFromPhone={() => {
                handleRunScan();
                setActiveTab('themes');
              }}
              onMoveApp={handleMoveApp}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
