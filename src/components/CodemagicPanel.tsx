import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react';
import type { AndroidProjectFile } from '../core/types';
import { validateCodemagicTriggerInput } from '../core/organizerEngine';

interface CodemagicPanelProps {
  onDownloadZip: () => void;
}

interface BuildPollState {
  buildId: string;
  status: string;
  artefacts: Array<{ name: string; url: string; type?: string }>;
}

export function CodemagicPanel({ onDownloadZip }: CodemagicPanelProps) {
  const [files, setFiles] = useState<AndroidProjectFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('codemagic.yaml');
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState('');

  const [apiToken, setApiToken] = useState('');
  const [appId, setAppId] = useState('');
  const [workflowId, setWorkflowId] = useState('android-homecraft-apk');
  const [branch, setBranch] = useState('main');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [triggerError, setTriggerError] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [buildState, setBuildState] = useState<BuildPollState | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  useEffect(() => {
    let active = true;
    setFilesLoading(true);
    fetch('/api/android-files')
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load Android project files');
        return res.json();
      })
      .then((data: { files: AndroidProjectFile[] }) => {
        if (!active) return;
        setFiles(data.files);
        if (data.files.length > 0) {
          setSelectedFilePath(data.files[0].path);
        }
        setFilesError('');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setFilesError(err instanceof Error ? err.message : 'Failed to load files');
      })
      .finally(() => {
        if (active) setFilesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeFile = files.find((f) => f.path === selectedFilePath) ?? files[0];

  const handleCopyActiveYaml = async () => {
    const yamlTarget =
      (activeFile?.language === 'yaml' ? activeFile : files.find((f) => f.path === 'codemagic.yaml')) ??
      activeFile;
    if (!yamlTarget) return;
    try {
      await navigator.clipboard.writeText(yamlTarget.content);
      setCopiedYaml(true);
      window.setTimeout(() => setCopiedYaml(false), 2000);
    } catch {
      // Clipboard blocked in restricted context; file remains selectable in viewer
    }
  };

  const handleTriggerBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggerError('');
    const validation = validateCodemagicTriggerInput({
      apiToken,
      appId,
      workflowId,
      branch,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});
    setIsTriggering(true);

    try {
      const response = await fetch('/api/codemagic/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken, appId, workflowId, branch }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          setTriggerError(data.error || 'Codemagic rejected the build request.');
        }
        return;
      }
      setBuildState({
        buildId: String(data.buildId),
        status: 'queued',
        artefacts: [],
      });
    } catch (err) {
      setTriggerError(err instanceof Error ? err.message : 'Failed to reach Codemagic endpoint.');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRefreshBuildStatus = async () => {
    if (!buildState?.buildId || !apiToken.trim()) return;
    setIsPolling(true);
    try {
      const response = await fetch(
        `/api/codemagic/builds/${encodeURIComponent(buildState.buildId)}`,
        {
          headers: { 'x-auth-token': apiToken.trim() },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setTriggerError(data.error || 'Could not poll Codemagic build status.');
        return;
      }
      const buildObj = (data.build ?? data) as {
        status?: string;
        artefacts?: Array<{ name: string; url: string; type?: string }>;
      };
      setBuildState({
        buildId: buildState.buildId,
        status: buildObj.status ?? 'running',
        artefacts: Array.isArray(buildObj.artefacts) ? buildObj.artefacts : [],
      });
    } catch (err) {
      setTriggerError(err instanceof Error ? err.message : 'Status check failed.');
    } finally {
      setIsPolling(false);
    }
  };

  return (
    <section aria-labelledby="codemagic-heading" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[260px]">
          <h1 id="codemagic-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
            Codemagic.io APK Build &amp; Android Source
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600 max-w-xl">
            Download the complete Kotlin Jetpack Compose project with{' '}
            <span className="font-mono text-xs text-neutral-800">codemagic.yaml</span> or trigger your Codemagic.io cloud APK build directly via REST API.
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadZip}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1F4D3E] rounded-lg hover:bg-[#173B2F] transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Download Project ZIP
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-5">
        <div className="border-b border-neutral-200 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Trigger Codemagic.io Cloud APK Build
            </h2>
            <p className="text-xs text-neutral-500">
              Calls <span className="font-mono">POST https://api.codemagic.io/builds</span> server-side to compile <span className="font-mono">app-debug.apk</span> and <span className="font-mono">app-release.apk</span>.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">workflow: android-homecraft-apk</span>
        </div>

        <form onSubmit={handleTriggerBuild} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="cm-token" className="block text-xs font-medium text-neutral-700">
                Codemagic API Token
              </label>
              <input
                id="cm-token"
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Paste Codemagic x-auth-token"
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-200 rounded-lg focus:outline-2 focus:outline-emerald-800"
              />
              {fieldErrors.apiToken && (
                <p className="text-xs text-red-600">{fieldErrors.apiToken}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cm-app-id" className="block text-xs font-medium text-neutral-700">
                Codemagic Application ID
              </label>
              <input
                id="cm-app-id"
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="e.g. 673a91c1e12b3c4d5e6f7081"
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-200 rounded-lg focus:outline-2 focus:outline-emerald-800"
              />
              {fieldErrors.appId && (
                <p className="text-xs text-red-600">{fieldErrors.appId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cm-workflow" className="block text-xs font-medium text-neutral-700">
                Workflow ID
              </label>
              <input
                id="cm-workflow"
                type="text"
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-200 rounded-lg focus:outline-2 focus:outline-emerald-800"
              />
              {fieldErrors.workflowId && (
                <p className="text-xs text-red-600">{fieldErrors.workflowId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cm-branch" className="block text-xs font-medium text-neutral-700">
                Git Branch
              </label>
              <input
                id="cm-branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-200 rounded-lg focus:outline-2 focus:outline-emerald-800"
              />
              {fieldErrors.branch && (
                <p className="text-xs text-red-600">{fieldErrors.branch}</p>
              )}
            </div>
          </div>

          {triggerError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{triggerError}</span>
            </div>
          )}

          {buildState && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>
                    Build <span className="font-mono">{buildState.buildId}</span> · Status:{' '}
                    <span className="capitalize">{buildState.status}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshBuildStatus}
                  disabled={isPolling}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white border border-emerald-300 rounded-md text-emerald-900 hover:bg-emerald-100"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Refresh Status
                </button>
              </div>
              {buildState.artefacts.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {buildState.artefacts.map((art) => (
                    <li key={art.url} className="text-xs">
                      <a
                        href={art.url}
                        className="font-mono text-emerald-800 underline hover:text-emerald-950"
                      >
                        {art.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-neutral-500">
              Step 1: Export ZIP &amp; push to GitHub/GitLab · Step 2: Connect repo on codemagic.io · Step 3: Trigger APK build here or on push.
            </p>
            <button
              type="submit"
              disabled={isTriggering}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {isTriggering ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4" aria-hidden="true" />
              )}
              {isTriggering ? 'Triggering Build...' : 'Trigger Codemagic Build'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <FileCode2 className="w-4 h-4 text-neutral-500" aria-hidden="true" />
            <span>Android APK Source &amp; codemagic.yaml</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 tabular-nums">{files.length} project files</span>
            <button
              type="button"
              onClick={handleCopyActiveYaml}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors whitespace-nowrap"
            >
              {copiedYaml ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  Copied YAML
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy codemagic.yaml
                </>
              )}
            </button>
          </div>
        </div>
        <div className="px-4 py-2.5 border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
          If Codemagic asks to create <span className="font-mono text-neutral-800">codemagic.yaml</span>, use{' '}
          <span className="font-mono text-neutral-800">codemagic.yaml (repo root)</span> when connecting this full repository, or{' '}
          <span className="font-mono text-neutral-800">codemagic.yaml</span> when uploading the exported Project ZIP.
        </div>

        {filesLoading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Loading Android project files...</div>
        ) : filesError ? (
          <div className="p-8 text-center text-sm text-red-600">{filesError}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-neutral-200 max-h-[380px] overflow-y-auto divide-y divide-neutral-100">
              {files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-mono truncate transition-colors ${
                    activeFile?.path === file.path
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {file.path}
                </button>
              ))}
            </div>
            <div className="md:col-span-8 bg-[#121518] text-neutral-100 max-h-[380px] overflow-auto p-4">
              {activeFile && (
                <pre className="text-xs font-mono leading-relaxed whitespace-pre">
                  <code>{activeFile.content}</code>
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
