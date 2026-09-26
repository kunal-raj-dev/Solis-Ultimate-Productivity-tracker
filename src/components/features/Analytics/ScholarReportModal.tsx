import React, { useMemo, useState } from 'react';
import { Download, Copy, CheckCircle2, Award, FileText } from 'lucide-react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { SolisIntelligenceReport } from '../../../utils/intelligence';
import {
  buildScholarReportMetrics,
  generateScholarReportSvg,
  generateScholarReportMarkdown
} from '../../../utils/export/scholarReportGenerator';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface ScholarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SolisIntelligenceReport;
  consistencyStreakDays: number;
}

export const ScholarReportModal: React.FC<ScholarReportModalProps> = ({
  isOpen,
  onClose,
  report,
  consistencyStreakDays
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [scholarName, setScholarName] = useState(() => user?.name || 'Solis Scholar');
  const [periodLabel, setPeriodLabel] = useState('Semester Deep-Work Dossier');
  const [copiedMd, setCopiedMd] = useState(false);

  const metrics = useMemo(
    () =>
      buildScholarReportMetrics({
        report,
        scholarName,
        periodLabel,
        consistencyStreakDays
      }),
    [report, scholarName, periodLabel, consistencyStreakDays]
  );

  const svgMarkup = useMemo(() => generateScholarReportSvg(metrics), [metrics]);
  const svgDataUri = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`,
    [svgMarkup]
  );

  const handleDownloadSvg = () => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solis-proof-of-study-${metrics.windowEndDate}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'Proof-of-Study Card Exported',
      description: `Saved verified SVG artifact (${metrics.verificationHash}).`,
      type: 'success'
    });
  };

  const handleDownloadMarkdown = () => {
    const md = generateScholarReportMarkdown(metrics);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solis-scholar-report-${metrics.windowEndDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'Semester Dossier Exported',
      description: 'Saved Markdown Proof-of-Study report.',
      type: 'success'
    });
  };

  const handleCopyMarkdown = async () => {
    const md = generateScholarReportMarkdown(metrics);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
      addToast({
        title: 'Copied to Clipboard',
        description: 'Markdown Proof-of-Study report is ready to paste into your portfolio or advisor update.',
        type: 'success'
      });
    } catch {
      addToast({
        title: 'Copy Failed',
        description: 'Please use the Download Markdown (.md) button instead.',
        type: 'warning'
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solis Scholar Report — Proof-of-Study Artifact"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--color-coral-500)" />
            <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Verified Academic Telemetry Card
            </span>
          </div>
          <Badge variant="sage">{metrics.verificationHash}</Badge>
        </div>

        {/* Customization Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Scholar Display Name
            </label>
            <input
              type="text"
              value={scholarName}
              onChange={(e) => setScholarName(e.target.value)}
              placeholder="Your Name"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-secondary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-caption)'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Dossier / Semester Title
            </label>
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="e.g. Autumn Semester 2026"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-secondary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-caption)'
              }}
            />
          </div>
        </div>

        {/* Live SVG Artifact Preview */}
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            background: '#141619',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)'
          }}
        >
          <img
            src={svgDataUri}
            alt="Solis Scholar Report Proof-of-Study Card"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Export Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={copiedMd ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            onClick={handleCopyMarkdown}
          >
            {copiedMd ? 'Copied Markdown' : 'Copy Markdown'}
          </Button>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<FileText size={14} />}
              onClick={handleDownloadMarkdown}
            >
              Download Dossier (.md)
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleDownloadSvg}
            >
              Export Proof Card (.svg)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
