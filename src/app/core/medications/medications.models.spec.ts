import { doseTimeMinutes, slotMeta } from './medications.models';

describe('medications.models', () => {
  describe('doseTimeMinutes', () => {
    it('parses AM and PM labels', () => {
      expect(doseTimeMinutes('8:00 AM')).toBe(480);
      expect(doseTimeMinutes('9:15 AM')).toBe(555);
      expect(doseTimeMinutes('2:00 PM')).toBe(840);
      expect(doseTimeMinutes('10:30 PM')).toBe(1350);
    });

    it('handles the midnight and noon boundaries', () => {
      expect(doseTimeMinutes('12:00 AM')).toBe(0);
      expect(doseTimeMinutes('12:30 PM')).toBe(750);
    });

    it('parses a weekly label with its day prefix', () => {
      expect(doseTimeMinutes('Monday · 8:00 AM')).toBe(480);
    });

    it('returns undefined for anything it cannot read', () => {
      expect(doseTimeMinutes('whenever')).toBeUndefined();
      expect(doseTimeMinutes('')).toBeUndefined();
      expect(doseTimeMinutes('25:00')).toBeUndefined();
    });
  });

  // Dose times are free-form, so a 4-entry lookup left every other time with the
  // raw string and a generic clock icon, losing the Schedule tab's grouping.
  describe('slotMeta', () => {
    it('keeps the labels the fixed slots used to have', () => {
      expect(slotMeta('8:00 AM').label).toBe('Morning');
      expect(slotMeta('2:00 PM').label).toBe('Afternoon');
      expect(slotMeta('8:00 PM').label).toBe('Evening');
      expect(slotMeta('10:00 PM').label).toBe('Bedtime');
    });

    it('groups an arbitrary time by part of day', () => {
      expect(slotMeta('9:15 AM').label).toBe('Morning');
      expect(slotMeta('1:45 PM').label).toBe('Afternoon');
      expect(slotMeta('7:05 PM').label).toBe('Evening');
      expect(slotMeta('11:59 PM').label).toBe('Bedtime');
    });

    it('gives every group an icon', () => {
      for (const time of ['9:15 AM', '1:45 PM', '7:05 PM', '11:59 PM']) {
        expect(slotMeta(time).icon).toBeTruthy();
      }
    });

    it('falls back to the raw label when the time is unparseable', () => {
      expect(slotMeta('whenever')).toEqual({ label: 'whenever', icon: '⏰' });
    });

    it('labels a weekly dose by its time of day', () => {
      expect(slotMeta('Monday · 8:00 AM').label).toBe('Morning');
    });
  });
});
