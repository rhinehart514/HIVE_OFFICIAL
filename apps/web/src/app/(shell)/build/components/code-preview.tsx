'use client';

import { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { BrandSpinner } from '@hive/ui';

export function CodePreview({
  status,
  codeOutput,
}: {
  status: string;
  codeOutput: { html: string; css: string; js: string } | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!codeOutput || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; }
          ${codeOutput.css}
        </style>
      </head>
      <body>
        ${codeOutput.html}
        <script>${codeOutput.js}<\/script>
      </body>
      </html>
    `);
    doc.close();
  }, [codeOutput]);

  return (
    <div className="w-full h-full flex flex-col">
      {status && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-white/30 border-b border-white/[0.06]">
          <Loader2 className="w-3 h-3 animate-spin" />
          {status}
        </div>
      )}
      {codeOutput ? (
        <iframe
          ref={iframeRef}
          className="flex-1 w-full border-0 rounded-b-2xl bg-[#0a0a0a]"
          sandbox="allow-scripts"
          title="App preview"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <BrandSpinner size="md" variant="gold" />
        </div>
      )}
    </div>
  );
}
