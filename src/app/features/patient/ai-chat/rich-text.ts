/**
 * Turns the light markdown Lucy replies with into structured blocks the chat
 * template renders as real elements.
 *
 * The bubble used to print the reply verbatim, so a model that had been told to
 * "use bullet points" showed patients raw `**`, `#` and `-` characters.
 *
 * Deliberately not a markdown library and deliberately not `innerHTML`: this is
 * model output rendered into a patient-facing page, so it never becomes markup.
 * The parser only ever produces text, and the template wraps that text in the
 * handful of tags below.
 */

/** One formatted run inside a line. */
export interface RichSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

export type RichBlockKind = 'paragraph' | 'heading' | 'bullets' | 'numbers';

/**
 * A flat shape rather than a discriminated union: Angular templates do not
 * narrow unions inside `@switch`, so every branch would need a cast.
 */
export interface RichBlock {
  kind: RichBlockKind;
  /** Heading level, 1-6. Meaningless for other kinds. */
  level: number;
  /** Content for `paragraph` and `heading`. */
  spans: RichSpan[];
  /** One entry per item, for `bullets` and `numbers`. */
  items: RichSpan[][];
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const FENCE = /^\s*```/;
const RULE = /^\s*([-*_])\s*(\1\s*){2,}$/;
const BLOCKQUOTE = /^\s*>\s?/;

// Code first, then bold, then italic: `**x**` must be consumed before `*x*` gets
// a chance at it, or every bold run renders as an italic wrapped in asterisks.
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

/** Splits one line into formatted runs. */
export function parseInline(line: string): RichSpan[] {
  const spans: RichSpan[] = [];

  for (const part of line.split(INLINE)) {
    if (!part) continue;

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      spans.push({ text: part.slice(1, -1), code: true });
    } else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      spans.push({ text: part.slice(2, -2), bold: true });
    } else if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      spans.push({ text: part.slice(2, -2), bold: true });
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      spans.push({ text: part.slice(1, -1), italic: true });
    } else if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      spans.push({ text: part.slice(1, -1), italic: true });
    } else {
      spans.push({ text: part });
    }
  }

  return spans.length ? spans : [{ text: line }];
}

function block(kind: RichBlockKind, level = 0): RichBlock {
  return { kind, level, spans: [], items: [] };
}

export function parseRichText(raw: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  let paragraph: string[] = [];
  let list: RichBlock | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const b = block('paragraph');
    // Wrapped lines belong to one paragraph; the bubble does its own wrapping.
    b.spans = parseInline(paragraph.join(' '));
    blocks.push(b);
    paragraph = [];
  };

  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.replace(BLOCKQUOTE, '').trimEnd();

    // Fences and rules carry no content worth showing in a chat bubble, and
    // leaving them in is exactly the noise this parser exists to remove.
    if (FENCE.test(line) || RULE.test(line)) {
      flushAll();
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushAll();
      const b = block('heading', heading[1].length);
      b.spans = parseInline(heading[2].trim());
      blocks.push(b);
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      flushParagraph();
      if (list?.kind !== 'bullets') {
        flushList();
        list = block('bullets');
      }
      list.items.push(parseInline(bullet[1].trim()));
      continue;
    }

    const numbered = NUMBERED.exec(line);
    if (numbered) {
      flushParagraph();
      if (list?.kind !== 'numbers') {
        flushList();
        list = block('numbers');
      }
      list.items.push(parseInline(numbered[1].trim()));
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushAll();
  return blocks;
}
