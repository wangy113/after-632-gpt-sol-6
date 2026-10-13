import { previousDate, type DateId } from './dates';
import { type PlaceId } from './places';
import { shouldAnimate, type MotionPolicy } from './motion';

export interface DateTransition {
  token: number;
  from: DateId;
  to: DateId;
}

export interface PlaceTransition {
  token: number;
  from: PlaceId;
  to: PlaceId;
}

export interface RoomState extends MotionPolicy {
  date: DateId;
  place: PlaceId;
  compareHeld: boolean;
  compareToggled: boolean;
  dateRevision: number;
  dateTransition: DateTransition | null;
  placeRevision: number;
  placeTransition: PlaceTransition | null;
}

export type Action =
  | { type: 'selectDate'; date: DateId }
  | { type: 'selectPlace'; place: PlaceId }
  | { type: 'setCompareHeld'; held: boolean }
  | { type: 'toggleCompare' }
  | { type: 'setReducedMotion'; reduced: boolean }
  | { type: 'setPaused'; paused: boolean }
  | { type: 'skipMovement' }
  | { type: 'finishDateTransition'; token: number }
  | { type: 'finishPlaceTransition'; token: number };

export const initialState: RoomState = {
  date: '632',
  place: 'doorway',
  compareHeld: false,
  compareToggled: false,
  systemReducedMotion: false,
  paused: false,
  dateRevision: 0,
  dateTransition: null,
  placeRevision: 0,
  placeTransition: null,
};

export function compareAvailable(state: RoomState): boolean {
  return previousDate(state.date) !== null;
}

export function isComparing(state: RoomState): boolean {
  return compareAvailable(state) && (state.compareHeld || state.compareToggled);
}

export function visibleDate(state: RoomState): DateId {
  return isComparing(state) ? previousDate(state.date)! : state.date;
}

export function reduce(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case 'selectDate': {
      if (action.date === state.date) {
        return state.compareToggled ? { ...state, compareToggled: false, dateTransition: null } : state;
      }
      const token = state.dateRevision + 1;
      const compareAtDestination = previousDate(action.date) !== null && state.compareHeld;
      const animate = shouldAnimate(state) && !isComparing(state) && !compareAtDestination;
      return {
        ...state,
        date: action.date,
        compareToggled: false,
        dateRevision: token,
        dateTransition: animate ? { token, from: state.date, to: action.date } : null,
        placeTransition: null,
      };
    }
    case 'selectPlace': {
      if (action.place === state.place) return state;
      const token = state.placeRevision + 1;
      return {
        ...state,
        place: action.place,
        placeRevision: token,
        placeTransition: shouldAnimate(state) ? { token, from: state.place, to: action.place } : null,
        dateTransition: null,
      };
    }
    case 'setCompareHeld': {
      if (action.held === state.compareHeld) return state;
      const next = { ...state, compareHeld: action.held };
      return isComparing(next) ? { ...next, dateTransition: null, placeTransition: null } : next;
    }
    case 'toggleCompare':
      return compareAvailable(state)
        ? { ...state, compareToggled: !state.compareToggled, dateTransition: null, placeTransition: null }
        : state;
    case 'setReducedMotion':
      return action.reduced === state.systemReducedMotion
        ? state
        : {
          ...state,
          systemReducedMotion: action.reduced,
          dateTransition: action.reduced ? null : state.dateTransition,
          placeTransition: action.reduced ? null : state.placeTransition,
        };
    case 'setPaused':
      return action.paused === state.paused
        ? state
        : {
          ...state,
          paused: action.paused,
          dateTransition: action.paused ? null : state.dateTransition,
          placeTransition: action.paused ? null : state.placeTransition,
        };
    case 'skipMovement':
      return state.dateTransition || state.placeTransition
        ? { ...state, dateTransition: null, placeTransition: null }
        : state;
    case 'finishDateTransition':
      return state.dateTransition?.token === action.token
        ? { ...state, dateTransition: null }
        : state;
    case 'finishPlaceTransition':
      return state.placeTransition?.token === action.token
        ? { ...state, placeTransition: null }
        : state;
  }
}
