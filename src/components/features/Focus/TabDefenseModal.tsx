import React, { useState } from 'react';
import { Shield, Plus, X, Download, CheckCircle2, Globe } from 'lucide-react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import {
  TabDefenseConfig,
  TabDriftEvent,
  normalizeDomainPattern,
  generateDeclarativeNetRequestRules,
  generateChromeExtensionManifest,
  summarizeTabDriftEvents
} from '../../../utils/focus/tabDefense';

export interface TabDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TabDefenseConfig;
  onChangeConfig: (next: TabDefenseConfig) => void;
  driftEvents: TabDriftEvent[];
}

export const TabDefenseModal: React.FC<TabDefenseModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  driftEvents
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const summary = summarizeTabDriftEvents(driftEvents);

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeDomainPattern(domainInput);
    if (!cleaned) {
      setErrorMsg('Enter a valid domain such as youtube.com or reddit.com');
      return;
    }
    if (config.blockedDomains.includes(cleaned)) {
      setErrorMsg('This domain is already in your shield list.');
      return;
    }
    setErrorMsg('');
    setDomainInput('');
    onChangeConfig({
      ...config,
      blockedDomains: [...config.blockedDomains, cleaned]
    });
  };

  const handleRemoveDomain = (domain: string) => {
    onChangeConfig({
      ...config,
      blockedDomains: config.blockedDomains.filter((d) => d !== domain)
    });
  };

  const handleDownloadRulesJson = () => {
    const redirectOrigin =
      typeof window !== 'undefined' ? `${window.location.origin}/app/focus?shield=intercepted` : undefined;
    const rules = generateDeclarativeNetRequestRules(config.blockedDomains, redirectOrigin);
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadManifestJson = () => {
    const manifest = generateChromeExtensionManifest();
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tab Defense & Chrome Companion Shield"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Status & Philosophy Banner */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield
              size={20}
              color={config.enabled ? 'var(--color-sage-600)' : 'var(--text-muted)'}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
                Active Focus Tab Defense
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Detects tab switches during running focus sessions and syncs with the Manifest V3 Chrome Shield.
              </div>
            </div>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-caption)', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onChangeConfig({ ...config, enabled: e.target.checked })}
            />
            <span>{config.enabled ? 'Shield Armed' : 'Shield Paused'}</span>
          </label>
        </div>

        {/* Live Session Telemetry */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}
        >
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {summary.focusPurityPercent}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tab Purity Score</div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {summary.totalDriftCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tab Switches</div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {summary.totalAwaySeconds}s
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Time Off-Tab</div>
          </div>
        </div>

        {/* Auto-log toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: 'var(--text-caption)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <span>Automatically log a gentle Mind Drift (+1) when leaving the Solis tab for 5+ seconds</span>
          <input
            type="checkbox"
            checked={config.autoLogDriftOnTabLeave}
            onChange={(e) =>
              onChangeConfig({ ...config, autoLogDriftOnTabLeave: e.target.checked })
            }
          />
        </label>

        {/* Blocked Distraction Domains */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Guarded Distraction Domains ({config.blockedDomains.length})
            </span>
            <Badge variant="neutral">Manifest V3 Compatible</Badge>
          </div>

          <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="Add domain to block during focus (e.g. news.ycombinator.com)"
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-caption)'
              }}
            />
            <Button type="submit" variant="outline" size="sm" leftIcon={<Plus size={14} />}>
              Add Domain
            </Button>
          </form>
          {errorMsg && (
            <span style={{ fontSize: '11px', color: 'var(--status-error)' }}>{errorMsg}</span>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {config.blockedDomains.map((domain) => (
              <span
                key={domain}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
              >
                <Globe size={12} color="var(--color-coral-500)" />
                <span>{domain}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(domain)}
                  aria-label={`Remove ${domain}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'inline-flex'
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Companion Chrome Extension Export */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)' }}>
            <CheckCircle2 size={14} color="var(--color-sage-600)" />
            <span>Companion Chrome Extension (Manifest V3)</span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Load <code>public/chrome-extension</code> as an unpacked extension in <code>chrome://extensions</code>, or export your customized <code>rules.json</code> below to redirect guarded domains back to Solis Focus Sanctuary.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={handleDownloadRulesJson}
            >
              Export rules.json
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={handleDownloadManifestJson}
            >
              Export manifest.json
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
