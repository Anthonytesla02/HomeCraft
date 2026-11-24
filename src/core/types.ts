export type AndroidPermissionId =
  | 'QUERY_ALL_PACKAGES'
  | 'ROLE_HOME'
  | 'SET_WALLPAPER'
  | 'PACKAGE_USAGE_STATS'
  | 'POST_NOTIFICATIONS';

export interface PermissionItem {
  id: AndroidPermissionId;
  title: string;
  androidPermission: string;
  apiLevel: string;
  required: boolean;
  granted: boolean;
  oemNotes: string;
  description: string;
}

export type DeviceProfileId =
  | 'pixel-9-pro'
  | 'galaxy-s24-ultra'
  | 'compact-android'
  | 'galaxy-z-fold';

export interface DeviceProfile {
  id: DeviceProfileId;
  name: string;
  oemSkin: string;
  androidVersion: string;
  widthDp: number;
  aspectClass: string;
  recommendedColumns: number;
  frameWidthPx: number;
  frameHeightPx: number;
}

export type AppCategory =
  | 'Communication'
  | 'Productivity'
  | 'Media'
  | 'Finance'
  | 'Utilities'
  | 'Social'
  | 'Navigation'
  | 'Games';

export interface ScannedApp {
  id: string;
  name: string;
  packageName: string;
  category: AppCategory;
  usageScore: number;
  iconColor: string;
  iconKey: string;
  isSystemApp: boolean;
}

export interface SmartFolder {
  id: string;
  name: string;
  category: AppCategory;
  apps: ScannedApp[];
}

export type IconShape = 'squircle' | 'circle' | 'rounded';
export type FolderStyle = 'bento' | 'compact' | 'minimal';

export interface HomeThemePreset {
  id: string;
  name: string;
  subtitle: string;
  surfaceMode: 'light' | 'dark';
  wallpaperUrl: string;
  fallbackGradient: string;
  iconShape: IconShape;
  folderStyle: FolderStyle;
  gridColumnsOffset: number;
  dockEnabled: boolean;
  cardSurface: string;
  cardBorder: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
}

export interface OrganizedLayout {
  columns: number;
  dockApps: ScannedApp[];
  folders: SmartFolder[];
}

export interface CodemagicTriggerInput {
  apiToken: string;
  appId: string;
  workflowId: string;
  branch: string;
}

export interface CodemagicValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CodemagicTriggerInput, string>>;
}

export interface AndroidProjectFile {
  path: string;
  language: 'yaml' | 'kotlin' | 'xml' | 'gradle' | 'properties';
  content: string;
}
