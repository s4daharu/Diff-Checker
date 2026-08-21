import {
  createHighlighterCore,
  type HighlighterCore,
  type ThemedToken,
} from 'shiki';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

const LANG_IMPORTS: Record<(typeof LANGS)[number], Promise<unknown>> = {
  json: import('shiki/langs/json.mjs'),
  python: import('shiki/langs/python.mjs'),
  typescript: import('shiki/langs/typescript.mjs'),
  javascript: import('shiki/langs/javascript.mjs'),
  markdown: import('shiki/langs/markdown.mjs'),
  sql: import('shiki/langs/sql.mjs'),
  html: import('shiki/langs/html.mjs'),
  css: import('shiki/langs/css.mjs'),
  bash: import('shiki/langs/bash.mjs'),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

const LANGS = [
  'json',
  'python',
  'typescript',
  'javascript',
  'markdown',
  'sql',
  'html',
  'css',
  'bash',
] as const;

export type LangId = (typeof LANGS)[number] | 'text';

const EXT_MAP: Record<string, LangId> = {
  json: 'json',
  jsonc: 'json',
  py: 'python',
  pyw: 'python',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  md: 'markdown',
  markdown: 'markdown',
  mdx: 'markdown',
  sql: 'sql',
  html: 'html',
  htm: 'html',
  vue: 'html',
  svg: 'html',
  css: 'css',
  scss: 'css',
  less: 'css',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
};

const THEME = {
  light: 'github-light',
  dark: 'github-dark',
} as const;

export function themeId(theme: 'light' | 'dark'): string {
  return THEME[theme];
}

export async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [
        import('@shikijs/themes/github-light'),
        import('@shikijs/themes/github-dark'),
      ] as never,
      langs: Object.values(LANG_IMPORTS) as never,
      engine: createOnigurumaEngine(import('shiki/wasm')),
    });
  }
  return highlighterPromise;
}

export function detectLang(
  oldName: string | null,
  newName: string | null,
  text: string,
): LangId {
  for (const name of [newName, oldName]) {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext && EXT_MAP[ext]) return EXT_MAP[ext];
  }
  return sniffLang(text);
}

function sniffLang(text: string): LangId {
  const head = text.slice(0, 2048);
  if (/^\s*(\{|\[)/.test(head)) {
    try {
      JSON.parse(text);
      return 'json';
    } catch {
      // fall through to other heuristics
    }
  }
  if (/^#!\s*\/.*\b(bash|sh|zsh)\b/m.test(head)) return 'bash';
  if (/^\s*<(?:!doctype|html|\w+[\s>])/im.test(head) && /<\/\w+>/i.test(head))
    return 'html';
  if (/(^|\n)\s*(def |class \w+[(:]|import \w+$|from \w+ import )/m.test(head))
    return 'python';
  if (
    /(^|\n)\s*(import .+ from |export (default|const|function|class)|const \w+ =|=>|function \w+\()/m.test(
      head,
    )
  )
    return 'typescript';
  if (/(^|\n)\s*(select\b.+from\b|insert into\b|create table\b|update \w+ set\b)/im.test(head))
    return 'sql';
  if (/(^|\n)#{1,3} \S/m.test(head) && /(^|\n)(\*\*|- |\d\. )/m.test(head))
    return 'markdown';
  return 'text';
}

const cache = new Map<string, ThemedToken[]>();
const CACHE_LIMIT = 8000;

export interface LineTokenizer {
  lang: LangId;
  getTokens(line: string): ThemedToken[] | null;
}

const tokenizerCache = new Map<string, Promise<LineTokenizer>>();

export function createLineTokenizer(
  lang: LangId,
  theme: 'light' | 'dark',
): Promise<LineTokenizer> {
  const key = `${lang}:${theme}`;
  let entry = tokenizerCache.get(key);
  if (!entry) {
    entry = buildLineTokenizer(lang, theme);
    tokenizerCache.set(key, entry);
  }
  return entry;
}

async function buildLineTokenizer(
  lang: LangId,
  theme: 'light' | 'dark',
): Promise<LineTokenizer> {
  if (lang === 'text') {
    return { lang, getTokens: () => null };
  }
  const hl = await getHighlighter();
  const themeName = THEME[theme];
  const cacheKeyPrefix = `${lang}:${themeName}:`;
  const tokenizer: LineTokenizer = {
    lang,
    getTokens(line: string): ThemedToken[] | null {
      if (!line.trim()) return null;
      const key = cacheKeyPrefix + line;
      const hit = cache.get(key);
      if (hit) return hit;
      let tokens: ThemedToken[][];
      try {
        ({ tokens } = hl.codeToTokens(line, {
          lang,
          theme: themeName,
        }));
      } catch {
        return null;
      }
      const result = tokens[0] ?? [];
      if (cache.size >= CACHE_LIMIT) cache.clear();
      cache.set(key, result);
      return result;
    },
  };
  return tokenizer;
}
