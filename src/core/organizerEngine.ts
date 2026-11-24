import type {
  AndroidPermissionId,
  AppCategory,
  CodemagicTriggerInput,
  CodemagicValidationResult,
  DeviceProfile,
  HomeThemePreset,
  OrganizedLayout,
  PermissionItem,
  ScannedApp,
  SmartFolder,
} from './types';

export function canScanApps(permissions: PermissionItem[]): {
  allowed: boolean;
  missingRequired: AndroidPermissionId[];
} {
  const missingRequired = permissions
    .filter((p) => p.required && !p.granted)
    .map((p) => p.id);

  return {
    allowed: missingRequired.length === 0,
    missingRequired,
  };
}

export function categorizePackage(packageName: string, appLabel: string): AppCategory {
  const pkg = packageName.toLowerCase();
  const lbl = appLabel.toLowerCase();

  if (
    pkg.includes('whatsapp') ||
    pkg.includes('dialer') ||
    pkg.includes('messaging') ||
    pkg.includes('telegram') ||
    pkg.includes('signal') ||
    pkg.includes('slack') ||
    pkg.includes('discord') ||
    pkg.includes('android.gm') ||
    lbl.includes('mail') ||
    lbl.includes('messages')
  ) {
    return 'Communication';
  }

  if (
    pkg.includes('bank') ||
    pkg.includes('chase') ||
    pkg.includes('paypal') ||
    pkg.includes('venmo') ||
    pkg.includes('wallet') ||
    pkg.includes('revolut') ||
    lbl.includes('wallet')
  ) {
    return 'Finance';
  }

  if (
    pkg.includes('maps') ||
    pkg.includes('uber') ||
    pkg.includes('lyft') ||
    pkg.includes('waze') ||
    pkg.includes('transit')
  ) {
    return 'Navigation';
  }

  if (
    pkg.includes('spotify') ||
    pkg.includes('netflix') ||
    pkg.includes('youtube') ||
    pkg.includes('podcasts') ||
    pkg.includes('audible') ||
    pkg.includes('photos')
  ) {
    return 'Media';
  }

  if (
    pkg.includes('instagram') ||
    pkg.includes('reddit') ||
    pkg.includes('threads') ||
    pkg.includes('tiktok')
  ) {
    return 'Social';
  }

  if (
    pkg.includes('obsidian') ||
    pkg.includes('todoist') ||
    pkg.includes('notion') ||
    pkg.includes('calendar') ||
    pkg.includes('docs') ||
    pkg.includes('drive')
  ) {
    return 'Productivity';
  }

  if (
    pkg.includes('game') ||
    pkg.includes('chess') ||
    pkg.includes('monument') ||
    pkg.includes('supercell')
  ) {
    return 'Games';
  }

  return 'Utilities';
}

const CATEGORY_ORDER: AppCategory[] = [
  'Communication',
  'Productivity',
  'Media',
  'Utilities',
  'Finance',
  'Navigation',
  'Social',
  'Games',
];

export function organizeAppsIntoFolders(
  apps: ScannedApp[],
  theme: HomeThemePreset,
  device: DeviceProfile,
  useUsageRanking = true
): OrganizedLayout {
  const columns = Math.max(4, Math.min(6, device.recommendedColumns + theme.gridColumnsOffset));
  const sorted = [...apps].sort((a, b) =>
    useUsageRanking ? b.usageScore - a.usageScore : a.name.localeCompare(b.name)
  );

  const dockCount = theme.dockEnabled ? Math.min(4, columns) : 0;
  const dockApps = sorted.slice(0, dockCount);
  const dockIds = new Set(dockApps.map((a) => a.id));

  const folders: SmartFolder[] = [];
  for (const category of CATEGORY_ORDER) {
    const groupApps = sorted.filter((a) => a.category === category && !dockIds.has(a.id));
    if (groupApps.length > 0) {
      folders.push({
        id: category.toLowerCase(),
        name: category,
        category,
        apps: groupApps,
      });
    }
  }

  folders.sort((a, b) => {
    const scoreA = a.apps.reduce((sum, app) => sum + app.usageScore, 0);
    const scoreB = b.apps.reduce((sum, app) => sum + app.usageScore, 0);
    return scoreB - scoreA;
  });

  return {
    columns,
    dockApps,
    folders,
  };
}

export function moveAppBetweenFolders(
  folders: SmartFolder[],
  appId: string,
  targetFolderId: string
): SmartFolder[] {
  let movedApp: ScannedApp | null = null;
  let sourceFolderId: string | null = null;

  for (const folder of folders) {
    const found = folder.apps.find((a) => a.id === appId);
    if (found) {
      movedApp = found;
      sourceFolderId = folder.id;
      break;
    }
  }

  if (!movedApp || sourceFolderId === targetFolderId) {
    return folders;
  }

  return folders
    .map((folder) => {
      if (folder.id === sourceFolderId) {
        return {
          ...folder,
          apps: folder.apps.filter((a) => a.id !== appId),
        };
      }
      if (folder.id === targetFolderId && movedApp) {
        return {
          ...folder,
          apps: [movedApp, ...folder.apps],
        };
      }
      return folder;
    })
    .filter((folder) => folder.apps.length > 0);
}

export function validateCodemagicTriggerInput(
  input: CodemagicTriggerInput
): CodemagicValidationResult {
  const errors: Partial<Record<keyof CodemagicTriggerInput, string>> = {};

  if (!input.apiToken.trim()) {
    errors.apiToken = 'Codemagic API token (x-auth-token) is required.';
  } else if (input.apiToken.trim().length < 12) {
    errors.apiToken = 'Token looks too short. Paste your Codemagic User Settings API token.';
  }

  if (!input.appId.trim()) {
    errors.appId = 'Codemagic Application ID is required.';
  }

  if (!input.workflowId.trim()) {
    errors.workflowId = 'Workflow ID is required (matches codemagic.yaml).';
  }

  if (!input.branch.trim() || /\s/.test(input.branch)) {
    errors.branch = 'Enter a valid Git branch name without spaces (e.g. main).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
