export type MomentId = '632' | '661' | '680';
export interface State {
  moment: MomentId;
  mode: 'reading' | 'interactive';
  sceneStatus: 'idle' | 'loading' | 'ready' | 'failed';
  paused: boolean;
  reduced: boolean;
}
export type Action =
  | { type: 'select'; id: MomentId }
  | { type: 'scene'; status: State['sceneStatus'] }
  | { type: 'mode'; mode: State['mode'] }
  | { type: 'pause'; paused: boolean }
  | { type: 'reduced'; reduced: boolean };
export const initialState: State = { moment: '632', mode: 'reading', sceneStatus: 'idle', paused: false, reduced: false };
export const motionAllowed = (state: State) => !state.paused && !state.reduced;
export function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'select': return { ...state, moment: action.id };
    case 'scene': return { ...state, sceneStatus: action.status, ...(action.status === 'failed' ? { mode: 'reading' as const } : {}) };
    case 'mode': return { ...state, mode: action.mode };
    case 'pause': return { ...state, paused: action.paused };
    case 'reduced': return { ...state, reduced: action.reduced };
  }
}
