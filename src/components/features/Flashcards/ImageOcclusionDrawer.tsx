import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImageOcclusionZone } from '../../../types/learning';
import { Button } from '../../ui/Button/Button';
import { Upload, Trash2 } from 'lucide-react';
import './ImageOcclusionDrawer.css';

// Built-in sample diagrams for immediate testing without file uploads
export const DIAGRAM_PRESETS = [
  {
    id: 'brain',
    name: 'Brain Lobes Anatomy',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"><rect width="600" height="400" fill="%2318181b"/><path d="M150,220 C120,130 200,60 330,60 C460,60 520,130 480,230 C450,300 370,340 270,330 C190,320 160,280 150,220 Z" fill="%2327272a" stroke="%23eb5e28" stroke-width="4"/><path d="M280,62 C290,150 270,220 250,328" stroke="%2352525b" stroke-width="2" stroke-dasharray="6,4"/><path d="M380,85 C390,170 380,240 470,250" stroke="%2352525b" stroke-width="2" stroke-dasharray="6,4"/><text x="180" y="160" fill="%23f4f4f5" font-family="sans-serif" font-weight="700" font-size="18">Frontal Lobe</text><text x="320" y="140" fill="%23f4f4f5" font-family="sans-serif" font-weight="700" font-size="18">Parietal Lobe</text><text x="400" y="210" fill="%23f4f4f5" font-family="sans-serif" font-weight="700" font-size="18">Occipital Lobe</text><text x="340" y="280" fill="%23f4f4f5" font-family="sans-serif" font-weight="700" font-size="18">Temporal Lobe</text><text x="240" y="375" fill="%23a1a1aa" font-family="sans-serif" font-size="14">Human Cerebral Cortex Anatomy</text></svg>',
    defaultZones: [
      { id: 'z1', x: 26, y: 35, width: 23, height: 10, label: 'Frontal Lobe' },
      { id: 'z2', x: 50, y: 30, width: 24, height: 10, label: 'Parietal Lobe' },
      { id: 'z3', x: 64, y: 47, width: 25, height: 10, label: 'Occipital Lobe' }
    ]
  },
  {
    id: 'mitochondria',
    name: 'Mitochondrion Organelle',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"><rect width="600" height="400" fill="%2318181b"/><ellipse cx="300" cy="200" rx="220" ry="120" fill="%2327272a" stroke="%2310b981" stroke-width="4"/><path d="M120,200 C150,140 200,260 250,150 C300,270 350,140 400,260 C450,150 480,200 480,200" fill="none" stroke="%2334d399" stroke-width="4"/><text x="140" y="100" fill="%23f4f4f5" font-family="sans-serif" font-weight="700" font-size="16">Outer Membrane</text><text x="350" y="90" fill="%23f4f4f5" font-family="sans-serif" font-weight="700" font-size="16">Inner Membrane</text><text x="280" y="320" fill="%23f4f4f5" font-family="sans-serif" font-weight="700" font-size="16">Mitochondrial Matrix</text><text x="230" y="375" fill="%23a1a1aa" font-family="sans-serif" font-size="14">Cellular Energy Synthesis Architecture</text></svg>',
    defaultZones: [
      { id: 'm1', x: 20, y: 20, width: 29, height: 10, label: 'Outer Membrane' },
      { id: 'm2', x: 55, y: 18, width: 29, height: 10, label: 'Inner Membrane' },
      { id: 'm3', x: 43, y: 75, width: 35, height: 10, label: 'Mitochondrial Matrix' }
    ]
  }
];

export interface ImageOcclusionDrawerProps {
  initialImageUrl?: string;
  initialZones?: ImageOcclusionZone[];
  initialActiveZoneId?: string;
  onChange: (data: {
    imageUrl: string;
    occlusionZones: ImageOcclusionZone[];
    activeOcclusionZoneId: string;
  }) => void;
}

export const ImageOcclusionDrawer: React.FC<ImageOcclusionDrawerProps> = ({
  initialImageUrl = DIAGRAM_PRESETS[0].url,
  initialZones = DIAGRAM_PRESETS[0].defaultZones,
  initialActiveZoneId = DIAGRAM_PRESETS[0].defaultZones[0]?.id || '',
  onChange
}) => {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [zones, setZones] = useState<ImageOcclusionZone[]>(initialZones);
  const [activeZoneId, setActiveZoneId] = useState<string>(initialActiveZoneId);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync upstream when zones or active target changes
  useEffect(() => {
    onChange({
      imageUrl,
      occlusionZones: zones,
      activeOcclusionZoneId: activeZoneId || zones[0]?.id || ''
    });
  }, [imageUrl, zones, activeZoneId, onChange]);

  const handlePresetSelect = (preset: typeof DIAGRAM_PRESETS[0]) => {
    setImageUrl(preset.url);
    setZones(preset.defaultZones);
    setActiveZoneId(preset.defaultZones[0]?.id || '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
        setZones([]);
        setActiveZoneId('');
      }
    };
    reader.readAsDataURL(file);
  };

  const getRelativeCoordinates = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Primary click only
    const coords = getRelativeCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint) return;
    const coords = getRelativeCoordinates(e);
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);
    setCurrentBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;
    setIsDrawing(false);
    setStartPoint(null);

    // Filter tiny unintentional clicks (minimum 2% width and height)
    if (currentBox.width >= 2 && currentBox.height >= 2) {
      const newZoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newZone: ImageOcclusionZone = {
        id: newZoneId,
        x: Math.round(currentBox.x * 10) / 10,
        y: Math.round(currentBox.y * 10) / 10,
        width: Math.round(currentBox.width * 10) / 10,
        height: Math.round(currentBox.height * 10) / 10,
        label: `Region ${zones.length + 1}`
      };

      setZones((prev) => [...prev, newZone]);
      if (!activeZoneId) {
        setActiveZoneId(newZoneId);
      }
    }
    setCurrentBox(null);
  };

  const handleUpdateZoneLabel = (zoneId: string, label: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, label } : z))
    );
  };

  const handleDeleteZone = (zoneId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZones((prev) => {
      const filtered = prev.filter((z) => z.id !== zoneId);
      if (activeZoneId === zoneId) {
        setActiveZoneId(filtered[0]?.id || '');
      }
      return filtered;
    });
  };

  return (
    <div className="solis-occlusion-drawer animate-fade-in">
      {/* 1. Presets & Upload Controls */}
      <div className="solis-occlusion-toolbar">
        <div className="solis-occlusion-presets">
          <span style={{ fontSize: 'var(--text-micro)', fontWeight: 600, color: 'var(--text-muted)' }}>
            Diagrams:
          </span>
          {DIAGRAM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`solis-occlusion-preset-btn ${imageUrl === preset.url ? 'solis-occlusion-preset-btn--active' : ''}`}
              onClick={() => handlePresetSelect(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload size={14} />}
          >
            Upload Custom Diagram
          </Button>
        </div>
      </div>

      {/* 2. Interactive Occlusion Canvas */}
      <div
        ref={containerRef}
        className="solis-occlusion-canvas-stage"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt="Visual Diagram for Active Recall"
          className="solis-occlusion-image"
          draggable={false}
        />

        {/* Existing Occlusion Masks */}
        {zones.map((zone, idx) => {
          const isTarget = zone.id === activeZoneId;
          return (
            <div
              key={zone.id}
              className={`solis-occlusion-box ${isTarget ? 'solis-occlusion-box--target' : 'solis-occlusion-box--inactive'}`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveZoneId(zone.id);
              }}
              title={`Click to set as Active Question Target. Label: ${zone.label || `Zone ${idx + 1}`}`}
            >
              <span className="solis-occlusion-box-badge">
                {isTarget ? '?' : `[${idx + 1}]`}
              </span>
            </div>
          );
        })}

        {/* In-Flight Drawing Rubberband Box */}
        {isDrawing && currentBox && (
          <div
            className="solis-occlusion-rubberband"
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.width}%`,
              height: `${currentBox.height}%`
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Click & drag on the diagram above to draw occlusion boxes. Click a box to select the active test target.
        </span>
        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-coral-500)' }}>
          {zones.length} Masks Placed
        </span>
      </div>

      {/* 3. Zone Answer Labels List */}
      {zones.length > 0 && (
        <div className="solis-occlusion-zones-list">
          {zones.map((zone, idx) => {
            const isTarget = zone.id === activeZoneId;
            return (
              <div
                key={zone.id}
                className={`solis-occlusion-zone-row ${isTarget ? 'solis-occlusion-zone-row--target' : ''}`}
                onClick={() => setActiveZoneId(zone.id)}
              >
                <span className="solis-occlusion-zone-tag">
                  {isTarget ? '★ Target' : `[${idx + 1}]`}
                </span>

                <input
                  type="text"
                  className="solis-occlusion-zone-input"
                  value={zone.label || ''}
                  placeholder={`Hidden answer for region ${idx + 1}...`}
                  onChange={(e) => handleUpdateZoneLabel(zone.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />

                <button
                  type="button"
                  className="solis-occlusion-zone-btn"
                  onClick={(e) => handleDeleteZone(zone.id, e)}
                  title="Remove this occlusion box"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
