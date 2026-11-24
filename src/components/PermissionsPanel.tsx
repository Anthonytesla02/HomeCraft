import { CheckCircle2, ShieldAlert, Smartphone } from 'lucide-react';
import type { AndroidPermissionId, PermissionItem } from '../core/types';

interface PermissionsPanelProps {
  permissions: PermissionItem[];
  allRequiredGranted: boolean;
  onTogglePermission: (id: AndroidPermissionId) => void;
  onGrantAllRequired: () => void;
  onGrantAll: () => void;
  onProceedToScan: () => void;
}

export function PermissionsPanel({
  permissions,
  allRequiredGranted,
  onTogglePermission,
  onGrantAllRequired,
  onGrantAll,
  onProceedToScan,
}: PermissionsPanelProps) {
  const grantedCount = permissions.filter((p) => p.granted).length;

  return (
    <section aria-labelledby="permissions-heading" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            id="permissions-heading"
            className="text-2xl font-bold tracking-tight text-neutral-900 text-balance"
          >
            Android Permissions &amp; Cross-Device Setup
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 max-w-2xl">
            Android isolates third-party launchers from modifying OEM home databases directly.
            Accepting <span className="font-mono text-xs text-neutral-800">QUERY_ALL_PACKAGES</span> and{' '}
            <span className="font-mono text-xs text-neutral-800">RoleManager.ROLE_HOME</span> lets HomeCraft
            scan every installed package and apply themes on Pixel, Samsung, Xiaomi, OnePlus, and foldable hardware.
          </p>
        </div>
        <div className="text-right tabular-nums text-xs text-neutral-500">
          <div className="text-lg font-semibold text-neutral-900">
            {grantedCount} / {permissions.length}
          </div>
          <div>Permissions active</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <Smartphone className="w-4 h-4 text-neutral-500" aria-hidden="true" />
            <span>API 26–35 · Universal OEM Compatibility Layer</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGrantAllRequired}
              className="px-3 py-1.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Accept Required
            </button>
            <button
              type="button"
              onClick={onGrantAll}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#1F4D3E] rounded-lg hover:bg-[#173B2F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Accept All Permissions
            </button>
          </div>
        </div>

        <ul className="divide-y divide-neutral-200">
          {permissions.map((perm) => (
            <li
              key={perm.id}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <h2 className="text-sm font-semibold text-neutral-900">{perm.title}</h2>
                  <span className="text-xs text-neutral-500">
                    {perm.required ? 'Required' : 'Optional'}
                  </span>
                  <span aria-hidden="true" className="text-neutral-300">
                    ·
                  </span>
                  <span className="font-mono text-xs text-neutral-500 truncate">
                    {perm.androidPermission}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{perm.description}</p>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                  <span>{perm.apiLevel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{perm.oemNotes}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    perm.granted ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {perm.granted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      Accepted
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                      Pending
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onTogglePermission(perm.id)}
                  aria-label={`${perm.granted ? 'Revoke' : 'Accept'} ${perm.title}`}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[36px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 ${
                    perm.granted
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                >
                  {perm.granted ? 'Revoke' : 'Accept'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <p className="text-xs text-neutral-500">
          {allRequiredGranted
            ? 'Required permissions accepted. Device package interface is unlocked for scanning.'
            : 'Accept both App Inventory Visibility and Default Home Screen Role to unlock app scanning.'}
        </p>
        <button
          type="button"
          onClick={onProceedToScan}
          disabled={!allRequiredGranted}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#1F4D3E] text-white hover:bg-[#173B2F] disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Continue to App Scanner
        </button>
      </div>
    </section>
  );
}
