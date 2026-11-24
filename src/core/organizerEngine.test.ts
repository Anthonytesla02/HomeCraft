import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canScanApps,
  categorizePackage,
  moveAppBetweenFolders,
  organizeAppsIntoFolders,
  validateCodemagicTriggerInput,
} from './organizerEngine';
import {
  DEVICE_PROFILES,
  INITIAL_PERMISSIONS,
  SCANNED_APP_CATALOG,
  THEME_PRESETS,
} from '../data/androidSeedData';

test('canScanApps blocks scanning until required Android permissions are granted', () => {
  const initialGate = canScanApps(INITIAL_PERMISSIONS);
  assert.equal(initialGate.allowed, false);
  assert.deepEqual(initialGate.missingRequired, ['QUERY_ALL_PACKAGES', 'ROLE_HOME']);

  const granted = INITIAL_PERMISSIONS.map((p) =>
    p.required ? { ...p, granted: true } : p
  );
  const readyGate = canScanApps(granted);
  assert.equal(readyGate.allowed, true);
  assert.deepEqual(readyGate.missingRequired, []);
});

test('categorizePackage accurately classifies cross-OEM Android packages', () => {
  assert.equal(categorizePackage('com.whatsapp', 'WhatsApp'), 'Communication');
  assert.equal(categorizePackage('com.chase.sig.android', 'Chase Mobile'), 'Finance');
  assert.equal(categorizePackage('com.spotify.music', 'Spotify'), 'Media');
  assert.equal(categorizePackage('com.sec.android.app.camera', 'Camera'), 'Utilities');
  assert.equal(categorizePackage('com.ubercab', 'Uber'), 'Navigation');
});

test('organizeAppsIntoFolders adapts columns and dock across phone and foldable devices', () => {
  const theme = THEME_PRESETS[0];
  const compact = DEVICE_PROFILES.find((d) => d.id === 'compact-android')!;
  const fold = DEVICE_PROFILES.find((d) => d.id === 'galaxy-z-fold')!;

  const compactLayout = organizeAppsIntoFolders(SCANNED_APP_CATALOG, theme, compact, true);
  const foldLayout = organizeAppsIntoFolders(SCANNED_APP_CATALOG, theme, fold, true);

  assert.equal(compactLayout.columns, 4);
  assert.equal(foldLayout.columns, 6);
  assert.equal(compactLayout.dockApps.length, 4);
  assert.ok(compactLayout.folders.length >= 4);
});

test('moveAppBetweenFolders transfers an app and removes empty source folders', () => {
  const theme = THEME_PRESETS[0];
  const device = DEVICE_PROFILES[0];
  const layout = organizeAppsIntoFolders(SCANNED_APP_CATALOG, theme, device, true);

  const sourceFolder = layout.folders[0];
  const targetFolder = layout.folders[1];
  const appToMove = sourceFolder.apps[0];

  const updated = moveAppBetweenFolders(layout.folders, appToMove.id, targetFolder.id);
  const nextSource = updated.find((f) => f.id === sourceFolder.id);
  const nextTarget = updated.find((f) => f.id === targetFolder.id)!;

  assert.ok(nextTarget.apps.some((a) => a.id === appToMove.id));
  assert.equal(nextSource?.apps.some((a) => a.id === appToMove.id) ?? false, false);
});

test('validateCodemagicTriggerInput rejects empty or malformed inputs', () => {
  const emptyResult = validateCodemagicTriggerInput({
    apiToken: '',
    appId: '',
    workflowId: 'android-homecraft-apk',
    branch: 'main branch',
  });
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.errors.apiToken);
  assert.ok(emptyResult.errors.appId);
  assert.ok(emptyResult.errors.branch);

  const validResult = validateCodemagicTriggerInput({
    apiToken: 'cm_live_valid_token_987654',
    appId: '673a91c1e12b3c4d5e6f7081',
    workflowId: 'android-homecraft-apk',
    branch: 'main',
  });
  assert.equal(validResult.valid, true);
});
