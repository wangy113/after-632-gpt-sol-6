import { describe, expect, it } from 'vitest';
import { DATE_IDS, dateChangeCaption, previousDate } from '../../src/state/dates';
import { PLACE_IDS } from '../../src/state/places';
import { shouldAnimate } from '../../src/state/motion';
import { compareAvailable, initialState, isComparing, reduce, visibleDate } from '../../src/state/store';

describe('room state', () => {
  it('accepts dates in any order and all four places', () => {
    for (const from of DATE_IDS) {
      for (const to of DATE_IDS) {
        const start = { ...initialState, date: from };
        const next = reduce(start, { type: 'selectDate', date: to });
        expect(next.date).toBe(to);
        if (from === to) expect(next).toBe(start);
        else expect(next.dateTransition).toEqual({ token: 1, from, to });
      }
    }

    let state = initialState;
    for (const place of PLACE_IDS) {
      state = reduce(state, { type: 'selectPlace', place });
      expect(state.place).toBe(place);
    }
    expect(state.placeTransition).toEqual({ token: 3, from: 'pegs', to: 'yard' });
  });

  it('compares with the previous date at the same place, then returns to the selected date', () => {
    let state = reduce(initialState, { type: 'selectDate', date: '661' });
    state = reduce(state, { type: 'selectPlace', place: 'yard' });
    state = reduce(state, { type: 'setCompareHeld', held: true });
    expect(isComparing(state)).toBe(true);
    expect(visibleDate(state)).toBe('632');
    expect(state.date).toBe('661');
    expect(state.place).toBe('yard');
    expect(state.dateTransition).toBeNull();
    expect(state.placeTransition).toBeNull();

    state = reduce(state, { type: 'setCompareHeld', held: false });
    expect(visibleDate(state)).toBe('661');
    state = reduce(state, { type: 'toggleCompare' });
    expect(visibleDate(state)).toBe('632');
    state = reduce(state, { type: 'selectDate', date: '680' });
    expect(visibleDate(state)).toBe('680');
    expect(state.compareToggled).toBe(false);
    expect(state.place).toBe('yard');
    state = reduce(state, { type: 'toggleCompare' });
    expect(visibleDate(state)).toBe('661');
    state = reduce(state, { type: 'selectDate', date: '680' });
    expect(visibleDate(state)).toBe('680');
    state = reduce(state, { type: 'toggleCompare' });
    expect(visibleDate(state)).toBe('661');
    state = reduce(state, { type: 'toggleCompare' });
    expect(visibleDate(state)).toBe('680');

    state = reduce(state, { type: 'setCompareHeld', held: true });
    state = reduce(state, { type: 'selectDate', date: '661' });
    expect(visibleDate(state)).toBe('632');
    state = reduce(state, { type: 'setCompareHeld', held: false });
    expect(visibleDate(state)).toBe('661');
  });

  it('does not compare before 632', () => {
    expect(previousDate('632')).toBeNull();
    expect(previousDate('661')).toBe('632');
    expect(previousDate('680')).toBe('661');
    expect(compareAvailable(initialState)).toBe(false);
    expect(reduce(initialState, { type: 'toggleCompare' })).toBe(initialState);
    expect(visibleDate(reduce(initialState, { type: 'setCompareHeld', held: true }))).toBe('632');
  });

  it('lets the newest selection win when earlier transitions finish late', () => {
    const first = reduce(initialState, { type: 'selectDate', date: '661' });
    const second = reduce(first, { type: 'selectDate', date: '680' });
    expect(second.dateTransition).toEqual({ token: 2, from: '661', to: '680' });
    expect(reduce(second, { type: 'finishDateTransition', token: 1 })).toBe(second);
    expect(reduce(second, { type: 'finishDateTransition', token: 2 }).dateTransition).toBeNull();

    const head = reduce(second, { type: 'selectPlace', place: 'head' });
    const yard = reduce(head, { type: 'selectPlace', place: 'yard' });
    expect(yard.placeTransition).toEqual({ token: 2, from: 'head', to: 'yard' });
    expect(reduce(yard, { type: 'finishPlaceTransition', token: 1 })).toBe(yard);
    expect(reduce(yard, { type: 'finishPlaceTransition', token: 2 }).placeTransition).toBeNull();
  });

  it('makes reduced motion, pause, and skip finish movement immediately', () => {
    let state = reduce(initialState, { type: 'selectDate', date: '661' });
    expect(state.dateTransition).not.toBeNull();
    state = reduce(state, { type: 'setReducedMotion', reduced: true });
    expect(state.dateTransition).toBeNull();
    expect(shouldAnimate(state)).toBe(false);
    state = reduce(state, { type: 'selectPlace', place: 'yard' });
    expect(state.placeTransition).toBeNull();

    state = reduce(state, { type: 'setReducedMotion', reduced: false });
    state = reduce(state, { type: 'selectDate', date: '680' });
    state = reduce(state, { type: 'setPaused', paused: true });
    expect(state.dateTransition).toBeNull();
    state = reduce(state, { type: 'selectPlace', place: 'head' });
    expect(state.placeTransition).toBeNull();

    state = reduce(state, { type: 'setPaused', paused: false });
    state = reduce(state, { type: 'selectPlace', place: 'pegs' });
    expect(state.placeTransition).not.toBeNull();
    expect(reduce(state, { type: 'skipMovement' }).placeTransition).toBeNull();
  });

  it('derives captions in either direction', () => {
    expect(dateChangeCaption('632', '661')).toBe('29 years later');
    expect(dateChangeCaption('661', '680')).toBe('19 years later');
    expect(dateChangeCaption('680', '632')).toBe('48 years earlier');
    expect(dateChangeCaption('661', '661')).toBeNull();
  });
});
