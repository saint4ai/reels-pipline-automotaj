import {createContext, useContext} from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../../theme';

// Среда стекла: фон слоя, который стеклянные панели повторяют внутри себя и преломляют.
// backdrop-filter со ссылкой на SVG-фильтр в headless Chrome молча не работает (O-1, LIQUID-GLASS-PATTERNS.md),
// поэтому панель рисует копию фона со своим смещением и вешает линзу обычным filter.
// Фон обязан быть чистой функцией кадра (useCurrentFrame), а id внутри SVG — через useId, иначе копии конфликтуют.
// Панель и фон лежат в одном слое: всё, что двигает слой (камера, переход), двигает их вместе, и копия совпадает.
export type Env = {w: number; h: number; render: () => React.ReactNode};
const EnvCtx = createContext<Env | null>(null);
export const useEnv = () => useContext(EnvCtx);

export const GlassEnv: React.FC<{bg: () => React.ReactNode; w?: number; h?: number; children?: React.ReactNode}> = ({bg, w = W, h = H, children}) => (
  <EnvCtx.Provider value={{w, h, render: bg}}>
    <AbsoluteFill style={{width: w, height: h}}>{bg()}</AbsoluteFill>
    {children}
  </EnvCtx.Provider>
);

// Среда без собственного фона: фон уже нарисован снаружи (общий холст с камерой, ролик 22), панели внутри только копируют его.
// bg обязан рисовать тот же фон в координатах этого слоя, иначе копия разъедется с настоящим.
export const EnvProvider: React.FC<{bg: () => React.ReactNode; w?: number; h?: number; children?: React.ReactNode}> = ({bg, w = W, h = H, children}) => (
  <EnvCtx.Provider value={{w, h, render: bg}}>{children}</EnvCtx.Provider>
);
