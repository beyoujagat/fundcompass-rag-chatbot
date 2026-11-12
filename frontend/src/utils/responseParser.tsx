import React from 'react';

export interface ParsedResponse {
  body: string;
  sourceUrl: string | null;
  lastUpdated: string;
}

// Parses assistant response to cleanly separate body, citation URL, and date, removing duplicate or malformed tokens
export function parseAssistantResponse(
  rawText: string,
  fallbackUrl?: string | null,
  fallbackDate?: string
): ParsedResponse {
  // 1. Remove stray citation bracket markers (e.g. 【...】 or 【. or stray 【)
  const cleaned = rawText
    .replace(/【.*?】/g, '')
    .replace(/【.*?$/g, '')
    .replace(/[【】]/g, '')
    .trim();

  // 2. Extract embedded citation URL if present
  let sourceUrl = fallbackUrl || null;
  const citationMatch = cleaned.match(/Source:\s*\[(.*?)\]\((.*?)\)/i) || cleaned.match(/Source:\s*(\S+)/i);
  if (citationMatch) {
    if (!sourceUrl) {
      sourceUrl = citationMatch[2] || citationMatch[1];
    }
  }

  // 3. Extract last updated timestamp if present
  let lastUpdated = fallbackDate || '2026-11-10';
  const dateMatch = cleaned.match(/Last updated from sources:\s*(\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    lastUpdated = dateMatch[1];
  }

  // 4. Strip the redundant raw Source: [...] and Last updated lines from the displayed body
  const body = cleaned
    .replace(/\n*Source:\s*\[.*?\]\(.*?\)/gi, '')
    .replace(/\n*Source:\s*\S+/gi, '')
    .replace(/\n*Last updated from sources:\s*\d{4}-\d{2}-\d{2}/gi, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();

  return { body, sourceUrl, lastUpdated };
}

// Lightweight markdown formatter for bold, code, and line breaks
export function renderFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part === '\n') {
      return <br key={index} />;
    }
    return part;
  });
}

