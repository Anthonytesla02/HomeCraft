import { useState } from 'react';
import { Lock, Plus, RefreshCw, Search } from 'lucide-react';
import type { AppCategory, ScannedApp } from '../core/types';
import { AppIconGlyph } from './AppIconGlyph';

interface ScannerPanelProps {
  canScan: boolean;
  hasScanned: boolean;
  isScanning: boolean;
  apps: ScannedApp[];
  onRunScan: () => void;
  onAddCustomApp: (name: string, packageName: string) => void;
  onGoToPermissions: () => void;
  onProceedToThemes: () => void;
}

const CATEGORIES: Array<'All' | AppCategory> = [
  'All',
  'Communication',
  'Productivity',
  'Media',
  'Utilities',
  'Finance',
  'Navigation',
  'Social',
  'Games',
];

export function ScannerPanel({
  canScan,
  hasScanned,
  isScanning,
  apps,
  onRunScan,
  onAddCustomApp,
  onGoToPermissions,
  onProceedToThemes,
}: ScannerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | AppCategory>('All');
  const [newAppName, setNewAppName] = useState('');
  const [newAppPackage, setNewAppPackage] = useState('');
  const [formError, setFormError] = useState('');

  if (!canScan) {
    return (
      <section aria-labelledby="scanner-locked-heading" className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h1 id="scanner-locked-heading" className="text-xl font-bold text-neutral-900">
            Accept Required Permissions First
          </h1>
          <p className="text-sm text-neutral-600">
            Android blocks package enumeration until App Inventory Visibility and Default Home Screen Role are granted.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToPermissions}
          className="px-5 py-2.5 text-sm font-medium text-white bg-[#1F4D3E] rounded-lg hover:bg-[#173B2F] transition-colors whitespace-nowrap"
        >
          Go to Permissions Setup
        </button>
      </section>
    );
  }

  const filteredApps = apps.filter((app) => {
    const matchesCat = selectedCategory === 'All' || app.category === selectedCategory;
    const matchesText =
      !searchQuery.trim() ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesText;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newAppPackage.trim()) {
      setFormError('Enter both an app name and Android package identifier (e.g. com.example.app).');
      return;
    }
    if (!newAppPackage.includes('.')) {
      setFormError('Package name must use reverse-domain format (e.g. com.company.tool).');
      return;
    }
    setFormError('');
    onAddCustomApp(newAppName.trim(), newAppPackage.trim());
    setNewAppName('');
    setNewAppPackage('');
  };

  return (
    <section aria-labelledby="scanner-heading" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[260px]">
          <h1 id="scanner-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
            App Interface Scanner
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600 max-w-xl">
            Queries <span className="font-mono text-xs text-neutral-800">LauncherApps.getActivityList()</span> across
            personal and work profiles, classifies packages, and ranks frequently used apps for smart folders.
          </p>
        </div>
        {hasScanned && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onRunScan}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} aria-hidden="true" />
              {isScanning ? 'Scanning...' : 'Rescan Apps'}
            </button>
            <button
              type="button"
              onClick={onProceedToThemes}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1F4D3E] rounded-lg hover:bg-[#173B2F] transition-colors whitespace-nowrap shrink-0"
            >
              Design Themes
            </button>
          </div>
        )}
      </div>

      {!hasScanned && !isScanning ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center space-y-3">
          <h2 className="text-base font-semibold text-neutral-900">Ready to scan device app drawer</h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto">
            Run the scanner to index all launchable packages, detect system vs. user apps, and prepare folder groupings.
          </p>
          <button
            type="button"
            onClick={onRunScan}
            className="px-5 py-2.5 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Scan Installed Apps
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter scanned apps or packages..."
                  aria-label="Filter scanned apps"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-2 focus:outline-emerald-800"
                />
              </div>
              <div className="text-xs text-neutral-500 tabular-nums">
                Showing {filteredApps.length} of {apps.length} scanned packages
              </div>
            </div>

            <div className="px-4 py-2.5 border-b border-neutral-200 flex items-center gap-1.5 overflow-x-auto bg-neutral-50/60">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === category
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-100">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AppIconGlyph
                      iconKey={app.iconKey}
                      color={app.iconColor}
                      name={app.name}
                      shape="squircle"
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-900 truncate">{app.name}</div>
                      <div className="font-mono text-xs text-neutral-500 truncate">{app.packageName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-neutral-600 tabular-nums">
                    <span>{app.category}</span>
                    <span aria-hidden="true" className="text-neutral-300">
                      ·
                    </span>
                    <span className="w-16 text-right font-mono">{app.usageScore}% use</span>
                  </div>
                </div>
              ))}
              {filteredApps.length === 0 && (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No installed apps match your current filter.
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleAddSubmit}
            className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3"
          >
            <div className="text-xs font-semibold text-neutral-700">
              Simulate Installing Another Package (Tests Auto-Categorization)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label htmlFor="custom-app-name" className="sr-only">
                  App Name
                </label>
                <input
                  id="custom-app-name"
                  type="text"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="App name (e.g. Notion)"
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-2 focus:outline-emerald-800"
                />
              </div>
              <div className="sm:col-span-5">
                <label htmlFor="custom-app-package" className="sr-only">
                  Package Name
                </label>
                <input
                  id="custom-app-package"
                  type="text"
                  value={newAppPackage}
                  onChange={(e) => setNewAppPackage(e.target.value)}
                  placeholder="Package (e.g. notion.id)"
                  className="w-full px-3 py-2 text-sm font-mono border border-neutral-200 rounded-lg focus:outline-2 focus:outline-emerald-800"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 border border-neutral-300 rounded-lg hover:bg-neutral-200 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add App
                </button>
              </div>
            </div>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
          </form>
        </>
      )}
    </section>
  );
}
