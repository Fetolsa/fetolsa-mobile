import { describe, it, expect } from 'vitest';
import { buildPairingSections } from './pairing';
import type { MenuItem } from "../types/menu";

const m = (code: string, extra: Partial<MenuItem> = {}): MenuItem => ({
  item_code: code, item_name: code, rate: 1000, category: 'X', ...extra,
});
const menu = new Map<string, MenuItem>([
  ['Jollof Rice', m('Jollof Rice', { suggested_addons: [
    { section: 'Proteins', items: ['Goat Meat', 'Turkey'] },
    { section: 'Drinks', items: ['Coke', 'Water'] }] })],
  ['Abacha', m('Abacha', { suggested_addons: [{ section: 'Drinks', items: ['PALM WINE', 'Coke'] }] })],
  ['Fried Rice', m('Fried Rice', { paired_drinks: ['Coke'] })],
  ['Goat Meat', m('Goat Meat')], ['Turkey', m('Turkey')], ['Coke', m('Coke')], ['Water', m('Water')], ['PALM WINE', m('PALM WINE')],
]);
const cart = (codes: string[]) => codes.map((c) => ({ item_code: c, item_name: c, qty: 1, rate: 1 }));
const view = (s: ReturnType<typeof buildPairingSections>) => s.map((x) => [x.section, x.items.map((i) => i.item_code)]);

describe('buildPairingSections', () => {
  it('merges sections across dishes, de-duplicated, in order', () => {
    expect(view(buildPairingSections(cart(['Jollof Rice', 'Abacha']), menu))).toEqual([
      ['Proteins', ['Goat Meat', 'Turkey']],
      ['Drinks', ['Coke', 'Water', 'PALM WINE']],
    ]);
  });
  it('skips what is already in the cart and drops empty sections', () => {
    expect(view(buildPairingSections(cart(['Jollof Rice', 'Goat Meat', 'Turkey', 'Coke']), menu))).toEqual([['Drinks', ['Water']]]);
  });
  it('drops codes that are not on the menu', () => {
    const only = new Map(menu); only.delete('Water');
    expect(view(buildPairingSections(cart(['Jollof Rice']), only))[1]).toEqual(['Drinks', ['Coke']]);
  });
  it('falls back to paired_drinks as one Drinks section', () => {
    expect(view(buildPairingSections(cart(['Fried Rice']), menu))).toEqual([['Drinks', ['Coke']]]);
  });
  it('caps each section', () => {
    expect(buildPairingSections(cart(['Jollof Rice']), menu, 1)[1].items).toHaveLength(1);
  });
});
