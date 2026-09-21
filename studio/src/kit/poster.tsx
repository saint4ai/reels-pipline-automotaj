import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DirectionalLight, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, Path, PlaneGeometry, PMREMGenerator, Scene, Shape, SRGBColorSpace, TubeGeometry, Vector2, Vector3} from 'three';
import {rounded} from './three';

// Стиль «техно-постер» (проба 19.09.2026 по референсам Александра: плакат BLAST/CS со стеклянным АК, Cyberpunk 2025, M56 techwear).
// Огромная типографика с обрезкой, штрих-коды, технические подписи, плашки со срезанными углами — и один стеклянный 3D-предмет
// поверх букв. Постер за предметом рисуется в текстуру внутри 3D-сцены, поэтому стекло по-настоящему преломляет буквы и штрихи.
export const POSTER = 'Inter Tight';
export const TECH = 'Tektur';
export const MONO = 'Martian Mono';
export const PC = {grey: '#D5D7D9', ink: '#0A0B0D', orange: '#FF7A2F', mint: '#3DEDC3', mintInk: '#05231D', white: '#EEEFF0', dim: '#8C9196'};
const PLATE_FONTS = [`900 100px "${POSTER}"`, `800 100px "${TECH}"`, `500 100px "${MONO}"`];

// Срезанные углы (как у панелей M56): размеры среза по углам [лв, пв, пн, лн].
export const chamfer = (w: number, h: number, [a, b, c, d]: [number, number, number, number]) =>
  `polygon(${a}px 0, ${w - b}px 0, ${w}px ${b}px, ${w}px ${h - c}px, ${w - c}px ${h}px, ${d}px ${h}px, 0 ${h - d}px, 0 ${a}px)`;

// Детерминированный штрих-код: ширины штрихов и просветов из псевдослучайной последовательности.
const rnd = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
export const barcodeBars = (w: number, seed = 7, unit = 3): [number, number][] => {
  const r = rnd(seed), bars: [number, number][] = [];
  for (let x = 0; x < w;) {
    const bw = unit * [1, 1, 2, 3, 4][Math.floor(r() * 5)];
    if (x + bw > w) break;
    bars.push([x, bw]);
    x += bw + unit * [1, 2, 2, 3][Math.floor(r() * 4)];
  }
  return bars;
};
export const Barcode: React.FC<{w: number; h: number; seed?: number; unit?: number; color?: string}> = ({w, h, seed = 7, unit = 3, color = PC.ink}) => (
  <svg width={w} height={h} style={{display: 'block'}}>
    <g fill={color} shapeRendering="crispEdges">{barcodeBars(w, seed, unit).map(([x, bw]) => <rect key={x} x={x} y={0} width={bw} height={h} />)}</g>
  </svg>
);
export const drawBarcode = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed = 7, unit = 3, color = PC.ink) => {
  ctx.fillStyle = color;
  for (const [bx, bw] of barcodeBars(w, seed, unit)) ctx.fillRect(x + bx, y, bw, h);
};

// Настоящий знак сервиса, перекрашенный маской (для одноцветных SVG вроде знака Claude: фирменный цвет #D97757).
export const BrandMark: React.FC<{src: string; size: number; color: string}> = ({src, size, color}) => (
  <span style={{display: 'block', width: size, height: size, background: color, WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`,
    WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center'}} />
);

// Плашка со срезанными углами и обводкой по всему контуру, включая срезы (CSS-border на clip-path рвётся на углах).
export const ChamferBox: React.FC<{w: number; h: number; cut: [number, number, number, number]; fill?: string; stroke?: string; sw?: number; style?: React.CSSProperties; children?: React.ReactNode}> =
  ({w, h, cut: [a, b, c, d], fill = 'none', stroke, sw = 3, style, children}) => {
    const p = `M${a} ${sw / 2} L${w - b} ${sw / 2} L${w - sw / 2} ${b} L${w - sw / 2} ${h - c} L${w - c} ${h - sw / 2} L${d} ${h - sw / 2} L${sw / 2} ${h - d} L${sw / 2} ${a} Z`;
    return (
      <div style={{position: 'relative', width: w, height: h, ...style}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}><path d={p} fill={fill} stroke={stroke ?? 'none'} strokeWidth={sw} strokeLinejoin="miter" /></svg>
        <div style={{position: 'relative', width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>{children}</div>
      </div>
    );
  };

// Перекрестье-метка печати.
export const Cross: React.FC<{x: number; y: number; color?: string; size?: number}> = ({x, y, color = PC.ink, size = 34}) => (
  <svg width={size} height={size} style={{position: 'absolute', left: x - size / 2, top: y - size / 2}}>
    <path d={`M${size / 2} 0V${size}M0 ${size / 2}H${size}`} stroke={color} strokeWidth={3} />
  </svg>
);

// Техническая подпись: моноширинный, чуть сжатый, заглавные. 48 px — минимум основного текста в 2K.
export const mono = (size = 48, weight = 500): React.CSSProperties => ({fontFamily: MONO, fontWeight: weight, fontSize: size, fontStretch: '87.5%', lineHeight: 1.2, letterSpacing: '0.01em', textTransform: 'uppercase'});
export const poster = (size: number, weight = 900, track = -0.045): React.CSSProperties => ({fontFamily: POSTER, fontWeight: weight, fontSize: size, lineHeight: 0.92, letterSpacing: `${track}em`});

// Зерно печати поверх постера: шум feTurbulence, на светлом умножение, на тёмном осветление.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1.4 -0.2'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;
export const Grain: React.FC<{dark?: boolean; opacity?: number; style?: React.CSSProperties}> = ({dark = false, opacity = 0.16, style}) => (
  <div style={{position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '300px 300px', opacity, mixBlendMode: dark ? 'screen' : 'multiply', pointerEvents: 'none', ...style}} />
);

// Текст на холсте постера: кегль, трекинг в долях кегля, выравнивание; y — базовая линия.
export const plateText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number,
  {family = POSTER, weight = 900, color = PC.ink, track = -0.045, align = 'left' as CanvasTextAlign} = {}) => {
  ctx.font = `${weight} ${size}px "${family}"`;
  (ctx as unknown as {letterSpacing: string}).letterSpacing = `${track * size}px`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

// ---------- 3D: студийный свет, стекло, геометрия предметов ----------

// Тёмная фотостудия с софтбоксами: стекло отражает темноту (тёмные кромки) и полосы света (блики), середина остаётся прозрачной —
// как у стеклянного АК на плакате. Светлая «комната» RoomEnvironment делала стекло молочным.
export const studio = () => {
  const s = new Scene();
  s.background = new Color('#0B0B0C');
  const box = (w: number, h: number, pos: [number, number, number], k: number) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({color: new Color(1, 1, 1).multiplyScalar(k), side: DoubleSide}));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  box(5, 2.2, [-4, 5, 4], 7);    // ключевой софтбокс сверху слева
  box(0.8, 7, [6, 0.5, 2], 3.5); // стрип справа — длинный блик по кромке
  box(7, 0.7, [0, -5, 3], 1.4);  // подсветка снизу
  box(3, 3, [1, 2, -6], 0.9);    // контровой сзади
  return s;
};
const Env: React.FC<{intensity: number}> = ({intensity}) => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(studio(), 0.02).texture;
    scene.environment = env;
    scene.environmentIntensity = intensity;
    gl.toneMappingExposure = 1.0;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene, intensity]);
  return null;
};

// Ключевой свет сверху слева с мягкой тенью на постер (VSM с размытием, как тень калаша на плакате).
const KeyLight: React.FC<{w: number; h: number}> = ({w, h}) => {
  const ref = useRef<DirectionalLight>(null);
  useLayoutEffect(() => {
    const l = ref.current; if (!l) return;
    l.shadow.mapSize.set(2048, 2048);
    Object.assign(l.shadow.camera, {left: -w / 2 - 200, right: w / 2 + 200, top: h / 2 + 200, bottom: -h / 2 - 200, near: 10, far: 6000});
    l.shadow.camera.updateProjectionMatrix();
    l.shadow.radius = 22;
    l.shadow.blurSamples = 20;
    l.shadow.bias = -0.0004;
  }, [w, h]);
  return <directionalLight ref={ref} position={[-900, 1100, 1800]} intensity={2.4} castShadow />;
};

// Прозрачное стекло: пропускание, толщина в пикселях сцены, лёгкая дисперсия (цветная кромка), лак.
export const glass = (tint = '#FFFFFF', rough = 0.04) => new MeshPhysicalMaterial({
  color: tint, metalness: 0, roughness: rough, transmission: 1, thickness: 90, ior: 1.5, dispersion: 0.35,
  clearcoat: 0.6, clearcoatRoughness: 0.03, specularIntensity: 1, envMapIntensity: 1.3, attenuationColor: '#EEF7F5', attenuationDistance: 1600,
});
export const chrome = () => new MeshPhysicalMaterial({color: '#E4E7EA', metalness: 1, roughness: 0.12, envMapIntensity: 2.2});
export const rubber = (c = '#0B0C0E') => new MeshPhysicalMaterial({color: c, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3});

// Сцена со стеклом: плоскость-постер (текстура с холста 2D) + мягкая тень + предметы. Единицы — CSS-пиксели:
// перспективная камера стоит так, что плоскость z=0 ложится на холст один к одному. Холст ставится до загрузки шрифтов не монтируется.
export type PlateDraw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
// Холст ждёт шрифты постера: рисовать текстуру до загрузки нельзя — подставится запасной шрифт и не перерисуется.
const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('шрифты постера для холста'));
  useEffect(() => { Promise.all(PLATE_FONTS.map((f) => document.fonts.load(f))).then(() => setReady(true)); }, []);
  useEffect(() => { if (ready) continueRender(handle); }, [ready, handle]);
  return ready;
};
const pixelRatio = () => (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);

// Тот же постер на обычном 2D-холсте — когда стеклянного предмета в кадре нет (на холсте-схеме так дешевле WebGL).
export const PlateCanvas: React.FC<{w: number; h: number; plate: PlateDraw}> = ({w, h, plate}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ready = useFontsReady();
  const dpr = pixelRatio();
  useLayoutEffect(() => {
    const c = ref.current; if (!ready || !c) return;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); plate(ctx, w, h);
  });
  return <canvas ref={ref} width={Math.round(w * dpr)} height={Math.round(h * dpr)} style={{display: 'block', width: w, height: h}} />;
};

export const GlassStage: React.FC<{w: number; h: number; plate: PlateDraw; shadow?: number; children?: React.ReactNode}> = ({w, h, plate, shadow = 0.2, children}) => {
  const ready = useFontsReady();
  const dpr = pixelRatio();
  const {canvas, tex} = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
    return {canvas: c, tex: t};
  }, [w, h, dpr]);
  if (ready) {
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    plate(ctx, w, h);
    tex.needsUpdate = true;
  }
  const fov = 18, dist = h / 2 / Math.tan((fov / 2) * Math.PI / 180);
  if (!ready) return null;
  return (
    <ThreeCanvas width={w} height={h} shadows="variance" camera={{fov, position: [0, 0, dist], near: 50, far: dist * 3}}
      gl={{antialias: true, preserveDrawingBuffer: true}}>
      <Env intensity={1} />
      <KeyLight w={w} h={h} />
      <directionalLight position={[900, -500, 900]} intensity={0.6} color="#FFD9BF" />
      <ambientLight intensity={0.2} />
      <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <mesh position={[0, 0, 1]} receiveShadow><planeGeometry args={[w, h]} /><shadowMaterial opacity={shadow} transparent /></mesh>
      {children}
    </ThreeCanvas>
  );
};
// Перевод координат кадра (левый верхний угол холста) в координаты сцены (центр, ось y вверх).
export const toStage = (w: number, h: number, x: number, y: number): [number, number] => [x - w / 2, h / 2 - y];

// Пузырь чата со хвостиком снизу слева, выдавленный с круглой фаской.
export const bubbleGeo = (w = 600, h = 430, r = 120, depth = 64, bevel = 30) => {
  const s = new Shape();
  const x0 = -w / 2 + bevel, x1 = w / 2 - bevel, y0 = -h / 2 + bevel, y1 = h / 2 - bevel, rr = r - bevel;
  s.moveTo(x0 + rr, y1);
  s.lineTo(x1 - rr, y1); s.quadraticCurveTo(x1, y1, x1, y1 - rr);
  s.lineTo(x1, y0 + rr); s.quadraticCurveTo(x1, y0, x1 - rr, y0);
  s.lineTo(x0 + rr + 110, y0);
  s.quadraticCurveTo(x0 + 50, y0 - 40, x0 - 70, y0 - 150);
  s.quadraticCurveTo(x0 + 10, y0 - 80, x0, y0 + 50);
  s.lineTo(x0, y1 - rr); s.quadraticCurveTo(x0, y1, x0 + rr, y1);
  const g = new ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 16, curveSegments: 48});
  g.center();
  return g;
};

// Корпус штекера: скруглённый брусок с фаской (ось выдавливания — к зрителю).
export const plugBodyGeo = (w = 300, h = 230, r = 56, depth = 150, bevel = 30) => {
  const g = new ExtrudeGeometry(rounded(new Shape(), w - bevel * 2, h - bevel * 2, r - bevel), {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 14, curveSegments: 32});
  g.center();
  return g;
};
// Кабель: трубка по сглаженной кривой через точки сцены.
export const cableGeo = (pts: [number, number, number][], radius = 30) =>
  new TubeGeometry(new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z))), 160, radius, 32, false);

// Двояковыпуклая линза радиуса R (вращение профиля вокруг оси y; повернуть к зрителю на π/2 по x).
export const lensGeo = (R = 190, T = 70, edge = 16) => {
  const pts: Vector2[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) { const r = (R * i) / n; pts.push(new Vector2(Math.max(0.01, r), edge / 2 + (T / 2 - edge / 2) * (1 - (r / R) ** 2))); }
  for (let i = n; i >= 0; i--) { const r = (R * i) / n; pts.push(new Vector2(Math.max(0.01, r), -edge / 2 - (T / 2 - edge / 2) * (1 - (r / R) ** 2))); }
  return new LatheGeometry(pts, 128);
};

// Бумажный самолётик: два крыла и киль, нос по +x.
export const planeGeo = (L = 420, span = 300, keel = 110) => {
  const N = [L * 0.55, 0, 0], C = [-L * 0.45, 0, 0], WL = [-L * 0.45, 26, -span / 2], WR = [-L * 0.45, 26, span / 2], K = [-L * 0.45, -keel, 0];
  const tri = [N, C, WL, N, WR, C, N, K, C];
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(tri.flat(), 3));
  g.computeVertexNormals();
  return g;
};
export const DOUBLE = DoubleSide;

// Рупор (реклама): раструб и корпус вращением профиля вокруг оси y; повернуть раструбом вправо (z −π/2).
export const megaphoneGeo = () => {
  const bell: Vector2[] = [[0.01, 0], [64, 0], [74, 40], [104, 140], [150, 250], [214, 340], [224, 356], [0.01, 356]].map(([x, y]) => new Vector2(x, y));
  const body: Vector2[] = [[0.01, -150], [58, -150], [72, -134], [72, -10], [64, 0], [0.01, 0]].map(([x, y]) => new Vector2(x, y));
  return {bell: new LatheGeometry(bell, 96), body: new LatheGeometry(body, 64)};
};
// Воронка продаж: полая стеклянная воронка с носиком (стенка 16 px).
export const funnelGeo = () => {
  const outer: [number, number][] = [[250, 190], [66, -50], [46, -80], [46, -300]];
  const inner: [number, number][] = [[30, -300], [30, -80], [50, -54], [232, 190]];
  return new LatheGeometry([...outer, ...inner, [250, 190]].map(([x, y]) => new Vector2(x, y)), 128);
};
// Ценник: прямоугольник со скруглением и отверстием для нитки.
export const tagGeo = (w = 340, h = 440, r = 60, depth = 34, bevel = 14) => {
  const s = rounded(new Shape(), w - bevel * 2, h - bevel * 2, r - bevel);
  const hole = new Path();
  hole.absarc(0, h / 2 - 78, 30, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 10, curveSegments: 48});
  g.center();
  return g;
};

// Рамка для настоящей записи экрана или страницы: срезанные углы, чёрная кайма, ярлык сверху слева.
export const MediaFrame: React.FC<{w: number; h: number; label?: string; dark?: boolean; children: React.ReactNode; style?: React.CSSProperties}> = ({w, h, label, dark = false, children, style}) => {
  const cut: [number, number, number, number] = [0, 44, 0, 44];
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      <div style={{position: 'absolute', left: 14, top: 14, width: w, height: h, clipPath: chamfer(w, h, cut), background: 'rgba(0,0,0,.35)'}} />
      <div style={{position: 'absolute', inset: 0, clipPath: chamfer(w, h, cut), background: dark ? PC.white : PC.ink}} />
      <div style={{position: 'absolute', left: 8, top: 8, width: w - 16, height: h - 16, clipPath: chamfer(w - 16, h - 16, [0, 38, 0, 38]), overflow: 'hidden', background: '#000'}}>{children}</div>
      {label ? <div style={{position: 'absolute', left: 0, top: -64, ...mono(48, 600), color: dark ? PC.white : PC.ink}}>{label}</div> : null}
    </div>
  );
};
