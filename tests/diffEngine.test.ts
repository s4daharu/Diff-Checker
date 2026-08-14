import {
  computeDiff,
  applyContext,
  buildUnifiedPatch,
  buildMarkdownDiff,
  buildHtmlDiffReport,
  countLines,
  countWords,
  formatJson,
  applyTextTransform,
} from '../src/lib/diffEngine';
import type { DiffOptions } from '../src/lib/types';
import { applyPatch } from 'diff';

const base: DiffOptions = {
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreLineEndings: false,
  context: 'all',
  granularity: 'chars',
};

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}`, detail ?? '');
  }
}

console.log('--- basic modification ---');
{
  const oldText = 'a\nb\nc\nd\ne\n';
  const newText = 'a\nB\nc\nd\nf\n';
  const r = computeDiff(oldText, newText, base);
  check('not aborted', !r.aborted);
  check('stats changed=2', r.stats?.changed === 2, r.stats);
  check('stats unchanged=3', r.stats?.unchanged === 3, r.stats);
  check('row count = 5', r.rows.length === 5);
  const modified = r.rows.filter((x) => x.kind === 'modified');
  check('modified rows have spans', modified.every((m) => m.oldSpans && m.newSpans));
  check('modified old/new content', modified[0].oldLine === 'b' && modified[0].newLine === 'B', modified[0]);
  check('old numbers sequential', r.rows.map((x) => x.oldNum).join(',') === '1,2,3,4,5');
  check('new numbers sequential', r.rows.map((x) => x.newNum).join(',') === '1,2,3,4,5');
}

console.log('--- pure addition at end ---');
{
  const r = computeDiff('a\nb\n', 'a\nb\nc\n', base);
  check('stats added=1', r.stats?.added === 1, r.stats);
  const kinds = r.rows.map((x) => x.kind).join(',');
  check('kinds equal,equal,added', kinds === 'equal,equal,added', kinds);
  check('added newNum=3', r.rows[2].newNum === 3 && r.rows[2].oldNum === null);
}

console.log('--- pure deletion ---');
{
  const r = computeDiff('a\nb\nc\n', 'a\nc\n', base);
  check('stats removed=1', r.stats?.removed === 1, r.stats);
  const kinds = r.rows.map((x) => x.kind).join(',');
  check('kinds equal,deleted,equal', kinds === 'equal,deleted,equal', kinds);
  check('deleted oldNum=2', r.rows[1].oldNum === 2 && r.rows[1].newNum === null);
}

console.log('--- ignore case ---');
{
  const r = computeDiff('Hello World\nfoo\n', 'hello WORLD\nfoo\n', {
    ...base,
    ignoreCase: true,
  });
  check('identical under ignoreCase', r.stats?.unchanged === 2 && r.stats?.changed === 0, r.stats);
}

console.log('--- ignore whitespace ---');
{
  const r = computeDiff('foo\n  bar  \nbaz\n', 'foo\nbar\nbaz\n', {
    ...base,
    ignoreWhitespace: true,
  });
  check('identical under ignoreWhitespace', r.stats?.unchanged === 3 && r.stats?.changed === 0, r.stats);
}

console.log('--- ignore line endings (CRLF) ---');
{
  const r = computeDiff('a\r\nb\r\n', 'a\nb\n', { ...base, ignoreLineEndings: true });
  check('identical under ignoreLineEndings', r.stats?.unchanged === 2, r.stats);
  const r2 = computeDiff('a\r\nb\r\n', 'a\nb\n', base);
  check('differs without option', r2.stats?.unchanged !== 2, r2.stats);
}

console.log('--- blank lines preserved ---');
{
  const r = computeDiff('a\n\nb\n', 'a\nb\n', base);
  const kinds = r.rows.map((x) => x.kind).join(',');
  check('blank line shows as deleted', kinds === 'equal,deleted,equal', kinds);
  check('deleted line is empty', r.rows[1].oldLine === '', r.rows[1]);
}

console.log('--- no trailing newline ---');
{
  const r = computeDiff('a\nb', 'a\nb\nc', base);
  check('added=1', r.stats?.added === 1, r.stats);
}

console.log('--- empty vs content ---');
{
  const r = computeDiff('', 'x\ny\n', base);
  check('added=2', r.stats?.added === 2, r.stats);
  check('oldLines=0, newLines=2', r.stats?.oldLines === 0 && r.stats?.newLines === 2, r.stats);
}

console.log('--- context trimming ---');
{
  const r = computeDiff('1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n', '1\n2\nX\n4\n5\n6\nY\n8\n9\n10\n', base);
  const trimmed = applyContext(r.rows, 1);
  const kinds = trimmed.map((x) => x.kind).join(',');
  check('gap present', trimmed.some((x) => x.kind === 'gap'), kinds);
  const gap = trimmed.find((x) => x.kind === 'gap');
  check('gap skipped=1', gap?.skipped === 1, gap);
  check('kept rows = 7 (6 + gap)', trimmed.length === 7, trimmed.length);
}

console.log('--- unified patch ---');
{
  const oldText = 'alpha\nbeta\ngamma\ndelta\n';
  const newText = 'alpha\nBETA\ngamma\nepsilon\n';
  const r = computeDiff(oldText, newText, base);
  const patch = buildUnifiedPatch(r.rows, 'all');
  console.log(patch);
  check('patch has headers', patch.startsWith('--- original.txt\n+++ changed.txt\n'), patch);
  check('patch has hunk', patch.includes('@@ -1,4 +1,4 @@'), patch);
  check('patch has -beta', patch.includes('-beta'), patch);
  check('patch has +BETA', patch.includes('+BETA'), patch);
  check('patch has +epsilon', patch.includes('+epsilon'), patch);
}

console.log('--- patch with context=1 ---');
{
  const oldText = '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n';
  const newText = '1\n2\nX\n4\n5\n6\nY\n8\n9\n10\n';
  const r = computeDiff(oldText, newText, base);
  const patch = buildUnifiedPatch(r.rows, 1);
  console.log(patch);
  check('two hunks', (patch.match(/@@/g) ?? []).length === 4, patch);
  check('first hunk -2,3 +2,3', patch.includes('@@ -2,3 +2,3 @@'), patch);
  check('second hunk -6,3 +6,3', patch.includes('@@ -6,3 +6,3 @@'), patch);
}

console.log('--- countLines & countWords ---');
{
  check('countLines empty', countLines('') === 0);
  check('countLines a\\n', countLines('a\n') === 1);
  check('countLines a\\n\\n', countLines('a\n\n') === 2);
  check('countLines no trailing', countLines('a\nb') === 2);
  check('countLines crlf', countLines('a\r\nb\r\n') === 2);
  check('countWords empty', countWords('') === 0);
  check('countWords text', countWords('hello world foo bar') === 4);
  check('countWords with whitespace', countWords('   multi \n line \t string   ') === 3);
}

console.log('--- formatJson and applyTextTransform ---');
{
  const jsonRaw = '{"b":2,"a":1}';
  const jsonFmt = formatJson(jsonRaw);
  check('formatJson success', jsonFmt.success && jsonFmt.result.includes('\n  "b": 2'));
  const jsonInvalid = formatJson('{not json}');
  check('formatJson error', !jsonInvalid.success && jsonInvalid.error !== undefined);

  const sortRes = applyTextTransform('cherry\napple\nbanana\n', 'sort-lines');
  check('sort-lines', sortRes.result === 'apple\nbanana\ncherry\n');

  const sortDescRes = applyTextTransform('apple\ncherry\nbanana\n', 'sort-lines-desc');
  check('sort-lines-desc', sortDescRes.result === 'cherry\nbanana\napple\n');

  const trimRes = applyTextTransform('  foo  \n  bar   \n', 'trim-whitespace');
  check('trim-whitespace', trimRes.result === 'foo\nbar\n');

  const blankRes = applyTextTransform('foo\n\n   \nbar\n', 'remove-blank-lines');
  check('remove-blank-lines', blankRes.result === 'foo\nbar\n');
}

console.log('--- buildMarkdownDiff and buildHtmlDiffReport ---');
{
  const r = computeDiff('hello\nworld\n', 'hello\nWORLD\n', base);
  const md = buildMarkdownDiff(r.rows, 'all', 'a.txt', 'b.txt');
  check('markdown diff starts with ```diff', md.startsWith('```diff\n'));
  check('markdown diff ends with ```\\n', md.endsWith('```\n'));
  check('markdown diff has +WORLD', md.includes('+WORLD'));

  const html = buildHtmlDiffReport({
    rows: r.rows,
    stats: r.stats,
    oldName: 'a.txt',
    newName: 'b.txt',
  });
  check('html report has doctype', html.includes('<!DOCTYPE html>'));
  check('html report has diff table', html.includes('class="diff-table"'));
}

console.log('--- applyContext with expanded gap indices ---');
{
  const r = computeDiff('1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n', '1\n2\nX\n4\n5\n6\nY\n8\n9\n10\n', base);
  const initialTrimmed = applyContext(r.rows, 1);
  check('initial has gap', initialTrimmed.some((x) => x.kind === 'gap'));
  const gap = initialTrimmed.find((x) => x.kind === 'gap');
  check('gap has gapStartRow & gapEndRow', gap?.gapStartRow === 4 && gap?.gapEndRow === 4);

  // Expand row 4 (the skipped line)
  const expanded = applyContext(r.rows, 1, new Set([4]));
  check('expanded has no gap', !expanded.some((x) => x.kind === 'gap'));
  check('expanded length = 7', expanded.length === 7);
}

console.log(`\n${failures === 0 ? 'ALL PASSED' : failures + ' FAILURES'}`);
console.log('--- patch round-trip ---');
{
  const cases = [
    ['alpha\nbeta\ngamma\ndelta\n', 'alpha\nBETA\ngamma\nepsilon\n', 'all'],
    ['1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n', '1\n2\nX\n4\n5\n6\nY\n8\n9\n10\n', 1],
    ['only line\n', 'completely different\nsecond\nthird\n', 'all'],
    ['a\nb\nc\n', '', 2],
    ['', 'x\ny\nz\n', 3],
    ['no newline at end', 'no newline at end changed', 0],
  ];
  for (const [old, next, ctx] of cases) {
    const r = computeDiff(old, next, base);
    const patch = buildUnifiedPatch(r.rows, ctx as never);
    const applied = applyPatch(old, patch);
    check(`round-trip ${JSON.stringify(ctx)}`, applied === next, { patch, applied, expected: next });
  }
}

console.log(`\n${failures === 0 ? 'ALL PASSED' : failures + ' FAILURES'}`);
process.exit(failures === 0 ? 0 : 1);
