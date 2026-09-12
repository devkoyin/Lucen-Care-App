import { RichSpan, parseInline, parseRichText } from './rich-text';

/** Flattens a block's runs back to plain text, ignoring formatting. */
const plain = (spans: RichSpan[]) => spans.map(s => s.text).join('');

describe('parseInline', () => {
  it('leaves unformatted text alone', () => {
    expect(parseInline('Take it with food.')).toEqual([{ text: 'Take it with food.' }]);
  });

  it('reads ** as bold and drops the markers', () => {
    const spans = parseInline('Take **two tablets** daily');

    expect(spans).toEqual([
      { text: 'Take ' },
      { text: 'two tablets', bold: true },
      { text: ' daily' },
    ]);
  });

  // The bug as reported: bold markers reaching the patient as literal asterisks.
  it('never leaves an asterisk in the output', () => {
    expect(plain(parseInline('**Important:** call your doctor'))).toBe('Important: call your doctor');
  });

  it('reads single asterisks and underscores as italic', () => {
    expect(parseInline('be *careful*')).toEqual([
      { text: 'be ' },
      { text: 'careful', italic: true },
    ]);
    expect(parseInline('be _careful_')).toEqual([
      { text: 'be ' },
      { text: 'careful', italic: true },
    ]);
  });

  // Bold has to be consumed first, or '**x**' renders as an italic wrapped in
  // stray asterisks — which looks exactly like the bug being fixed.
  it('prefers bold over italic when both could match', () => {
    expect(parseInline('**strong**')).toEqual([{ text: 'strong', bold: true }]);
  });

  it('reads backticks as code', () => {
    expect(parseInline('the `metformin` entry')).toEqual([
      { text: 'the ' },
      { text: 'metformin', code: true },
      { text: ' entry' },
    ]);
  });

  // A lone asterisk or a multiplication sign is not an unclosed emphasis run.
  it('leaves an unpaired marker as ordinary text', () => {
    expect(plain(parseInline('2 * 3 = 6'))).toBe('2 * 3 = 6');
    expect(plain(parseInline('a * b'))).toBe('a * b');
  });
});

describe('parseRichText', () => {
  it('turns a bare sentence into one paragraph', () => {
    const blocks = parseRichText('Hello Ada, how can I help?');

    expect(blocks.length).toBe(1);
    expect(blocks[0].kind).toBe('paragraph');
    expect(plain(blocks[0].spans)).toBe('Hello Ada, how can I help?');
  });

  it('reads # lines as headings and keeps the hashes out of the text', () => {
    const blocks = parseRichText('### Before your appointment\nBring your card.');

    expect(blocks[0].kind).toBe('heading');
    expect(blocks[0].level).toBe(3);
    expect(plain(blocks[0].spans)).toBe('Before your appointment');
    expect(blocks[1].kind).toBe('paragraph');
  });

  it('groups consecutive dashes into one bullet list', () => {
    const blocks = parseRichText('- Bring your card\n- List your medicines\n- Write questions down');

    expect(blocks.length).toBe(1);
    expect(blocks[0].kind).toBe('bullets');
    expect(blocks[0].items.map(plain)).toEqual([
      'Bring your card',
      'List your medicines',
      'Write questions down',
    ]);
  });

  it('accepts the other bullet characters a model may use', () => {
    expect(parseRichText('* one\n* two')[0].kind).toBe('bullets');
    expect(parseRichText('• one\n• two')[0].kind).toBe('bullets');
  });

  it('reads numbered lists', () => {
    const blocks = parseRichText('1. Take it with water\n2. Wait ten minutes');

    expect(blocks[0].kind).toBe('numbers');
    expect(blocks[0].items.map(plain)).toEqual(['Take it with water', 'Wait ten minutes']);
  });

  it('does not merge a bullet list into a numbered one', () => {
    const kinds = parseRichText('- a\n- b\n1. c').map(b => b.kind);

    expect(kinds).toEqual(['bullets', 'numbers']);
  });

  it('formats inside list items', () => {
    const blocks = parseRichText('- Take **two** tablets');

    expect(blocks[0].items[0]).toEqual([
      { text: 'Take ' },
      { text: 'two', bold: true },
      { text: ' tablets' },
    ]);
  });

  it('joins a wrapped paragraph into one block', () => {
    const blocks = parseRichText('Blood pressure is\nmeasured in two numbers.');

    expect(blocks.length).toBe(1);
    expect(plain(blocks[0].spans)).toBe('Blood pressure is measured in two numbers.');
  });

  it('splits paragraphs on a blank line', () => {
    const blocks = parseRichText('First point.\n\nSecond point.');

    expect(blocks.map(b => plain(b.spans))).toEqual(['First point.', 'Second point.']);
  });

  // Fences, rules and quote markers are noise in a chat bubble, and leaving them
  // in is the same class of problem as the asterisks.
  it('drops code fences and horizontal rules', () => {
    const blocks = parseRichText('Here:\n```\nsome text\n```\n---\nDone.');
    const text = blocks.map(b => plain(b.spans)).join(' ');

    expect(text).not.toContain('```');
    expect(text).not.toContain('---');
  });

  it('strips blockquote markers', () => {
    expect(plain(parseRichText('> Remember to fast beforehand.')[0].spans))
      .toBe('Remember to fast beforehand.');
  });

  it('returns nothing for an empty reply', () => {
    expect(parseRichText('')).toEqual([]);
    expect(parseRichText('   \n  ')).toEqual([]);
  });

  // The whole point: nothing the parser emits should still carry syntax.
  it('leaves no markdown syntax anywhere in a realistic reply', () => {
    const reply = [
      '## Managing your blood pressure',
      '',
      'Here are a few things that help, **Ada**:',
      '',
      '- Cut back on *added salt*',
      '- Walk for 30 minutes most days',
      '1. Check your reading each morning',
      '',
      'Always talk to your doctor before changing anything.',
    ].join('\n');

    const rendered = parseRichText(reply)
      .flatMap(b => [...b.spans, ...b.items.flat()])
      .map(s => s.text)
      .join(' ');

    expect(rendered).not.toMatch(/[*#`]|^-\s|\s-\s/);
    expect(rendered).toContain('Managing your blood pressure');
    expect(rendered).toContain('Ada');
    expect(rendered).toContain('added salt');
  });
});
