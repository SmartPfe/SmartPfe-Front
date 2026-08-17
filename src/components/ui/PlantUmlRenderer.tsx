import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { renderToString } from '@plantuml/core';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';

interface PlantUmlRendererProps {
  markup: string;
  className?: string;
  diagramName?: string;
}

export default function PlantUmlRenderer({ markup, className, diagramName = 'diagram' }: PlantUmlRendererProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Render PlantUML markup → SVG via @plantuml/core ─────────────
  useEffect(() => {
    let isMounted = true;

    const renderDiagram = () => {
      setLoading(true);
      setError(null);

      try {
        const lines = markup.split('\n');
        renderToString(
          lines,
          (resultSvg: string) => {
            if (isMounted) {
              setSvg(resultSvg);
              setLoading(false);
            }
          },
          (errorMessage: string) => {
            if (isMounted) {
              setError(errorMessage);
              setLoading(false);
            }
          }
        );
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while rendering the diagram.');
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(renderDiagram, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [markup]);

  // ── Download the rendered diagram as a PNG ──────────────────────
  const downloadPng = async () => {
    const container = containerRef.current;
    if (!container || downloading) return;

    setDownloading(true);

    try {
      // html-to-image captures the DOM element exactly as rendered on screen
      const dataUrl = await toPng(container, {
        backgroundColor: '#ffffff',
        pixelRatio: 2, // 2× for crisp retina/print quality
        cacheBust: true,
      });

      // Convert data URL to a proper PNG blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const cleanFileName = diagramName.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Use the native "Save As" dialog (File System Access API)
      // This bypasses all browser download attribute quirks
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `${cleanFileName}.png`,
            types: [{
              description: 'PNG Image',
              accept: { 'image/png': ['.png'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err: any) {
          // User cancelled the dialog — that's fine
          if (err.name !== 'AbortError') {
            console.error('Save failed:', err);
          }
        }
      } else {
        // Fallback for Firefox/Safari: use <a> download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cleanFileName}.png`;
        document.body.appendChild(link);
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (err) {
      console.error('Failed to download PNG:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-[450px] w-full bg-surface-container-low/50 rounded-xl border border-outline-variant", className)}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-on-surface-variant animate-pulse">Rendering diagram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-[450px] w-full bg-error-container/20 rounded-xl border border-error/30 p-6 text-center", className)}>
        <span className="material-symbols-outlined text-error text-[32px] mb-3">error_outline</span>
        <h3 className="text-base font-bold text-on-surface mb-2">Diagram Rendering Error</h3>
        <p className="text-sm text-on-surface-variant max-w-md break-all">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full min-h-[450px] flex items-center justify-center bg-surface-container-lowest rounded-xl border border-outline-variant overflow-auto relative p-6 group", className)}>
      <div 
        ref={containerRef}
        className="[&_svg]:max-w-full [&_svg]:h-auto flex items-center justify-center select-none"
        dangerouslySetInnerHTML={{ __html: svg || '' }}
      />
      {svg && (
        <div className="absolute top-4 right-4">
          <button 
            type="button"
            onClick={downloadPng}
            disabled={downloading}
            title="Download diagram as PNG image"
            className="group/btn px-2.5 py-2.5 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-on-primary flex items-center gap-0 hover:gap-2 transition-all duration-300 shadow-md disabled:opacity-50 overflow-hidden"
          >
            {downloading ? (
              <span className="w-[18px] h-[18px] border-2 border-on-primary border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <span className="material-symbols-outlined text-[18px] shrink-0">download</span>
            )}
            <span className="max-w-0 group-hover/btn:max-w-[120px] overflow-hidden whitespace-nowrap transition-all duration-300 opacity-0 group-hover/btn:opacity-100">
              {downloading ? 'Saving...' : 'Download PNG'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
