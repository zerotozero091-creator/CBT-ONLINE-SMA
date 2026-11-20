/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Robust component to render text containing LaTeX formulas using KaTeX.
 * Supports:
 * - Block formulas: $$ formula $$ or \[ formula \]
 * - Inline formulas: $ formula $ or \( formula \)
 * - Regular prose mixed with multiple formulas
 */
export const MathText: React.FC<MathTextProps> = ({ content, className = '', inline = false }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Check if there are any math delimiters
    const hasMath = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/.test(content);
    if (!hasMath) {
      // Escape basic HTML entities if no math
      return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
    }

    try {
      // Parse block math $$...$$ first, then inline math $...$
      // We will tokenize the string
      let processed = content;

      // 1. Block formulas $$ ... $$
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'htmlAndMathml',
          });
        } catch {
          return `<span class="katex-error font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded text-xs">$$${math}$$</span>`;
        }
      });

      // 2. Block formulas \[ ... \]
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'htmlAndMathml',
          });
        } catch {
          return `<span class="katex-error font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded text-xs">\\[${math}\\]</span>`;
        }
      });

      // 3. Inline formulas \( ... \)
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'htmlAndMathml',
          });
        } catch {
          return `<span class="katex-error font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded text-xs">\\(${math}\\)</span>`;
        }
      });

      // 4. Inline formulas $ ... $ (avoiding currency like $100 by requiring non-space after first $)
      processed = processed.replace(/\$([^$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'htmlAndMathml',
          });
        } catch {
          return `<span class="katex-error font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded text-xs">$${math}$</span>`;
        }
      });

      // Convert remaining standard linebreaks outside tags
      return processed.replace(/\n/g, '<br/>');
    } catch {
      return content;
    }
  }, [content]);

  if (inline) {
    return (
      <span
        className={`katex-renderer inline ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div
      className={`katex-renderer leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

export default MathText;
