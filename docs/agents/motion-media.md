# Motion, transitions and 3D

Rules for animation, scene transitions, video and 3D in `apps/web`, `apps/site` and `apps/hub`. The UI/UX agent owns this work. CI/CD installs the packages. Reviewer checks the budget at the end of this file.

## Pick the tool

| Need | Use |
| :--- | :--- |
| Hover, press, enter and exit of UI elements; progress rings and bars; route changes | CSS transitions and keyframes on `transform` and `opacity`, or SVG. The View Transitions API is allowed as an enhancement that degrades to no animation. |
| Real-time 3D the visitor can look at or interact with (a hero object, a body model viewer) | three.js through `@react-three/fiber` |
| Timeline content made of scenes: scene-to-scene transitions, product and feature intros, exercise demo clips, a progress recap | Remotion with `@remotion/transitions` |
| 3D inside a Remotion video | `@remotion/three` |

- UI transitions use the `transitions-dev` skill (`.agents/skills/transitions-dev`) and the duration and easing tokens in `packages/ui/src/motion.css`. Add a snippet to that file once and reuse it; do not hard-code durations in a component. Use `transitions-polish` to refine existing motion.
- Do not use Remotion for UI micro-interactions, and do not use three.js for an effect CSS or SVG can draw.
- Do not add another animation library (Framer Motion, GSAP, Lottie and similar). A case for one goes to the human as an ADR proposal.
- The frontend rule in `AGENTS.md` still holds: nothing here may block first paint or drop the page below 60 FPS.

## Packages

| Package | Version | State on 2026-11-14 |
| :--- | :--- | :--- |
| `three`, `@types/three` | `^0.187.0` | Installed in hub, site and web. Not imported anywhere yet. |
| `@react-three/fiber` | `9.x` (needs React 19 and `three >= 0.156`) | Not installed |
| `@react-three/drei` | matching fiber 9 | Not installed. Optional. Import helpers one by one. |
| `remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/transitions`, `@remotion/three` | `4.0.x`, all on one exact version, no `^` (latest is `4.0.543`) | Not installed |

- Every `remotion` and `@remotion/*` package in the repo has the same exact version. Check with `npx remotion versions`. Upgrade them together with `npx remotion upgrade`.
- `@remotion/renderer`, `@remotion/lambda` and any server-side or on-demand rendering are out of scope until an ADR approves them.
- Consume Remotion from npm. Do not clone or vendor `remotion-dev/remotion` into this repo.

### Remotion licence

Remotion is not MIT. It is free for individuals and for companies of up to three people. A larger company needs a paid company licence (see <https://www.remotion.dev/docs/license>). Reviewer confirms with the human at each sprint close that the team still qualifies. No agent decides this.

### Remotion agent skills

The Remotion team publishes agent skills in `packages/skills` of <https://github.com/remotion-dev/remotion>. An agent doing Remotion work loads `/remotion-best-practices` first and treats <https://www.remotion.dev/docs> as the reference, ahead of its own memory of the API.

Install once per machine (the human runs this, or approves it):

```bash
npx skills add remotion-dev/skills
```

After Remotion is installed in the repo, `npx remotion skills add` does the same.

## Where the code lives

- **Remotion compositions:** a workspace `packages/motion` (`@g-ai/motion`), created when the first composition is needed.
  - `src/index.ts` calls `registerRoot`, `src/Root.tsx` lists every `<Composition>`, `src/compositions/<Name>/` holds one composition each.
  - `@remotion/cli` is a dev dependency of this workspace only.
  - Apps import a composition from `@g-ai/motion` and play it with `@remotion/player`. The app adds `@g-ai/motion` to `transpilePackages` (CI/CD lane).
- **3D scenes:** `apps/<app>/src/components/three/`. Keep three.js out of `packages/ui`, so a page without 3D never loads it.
- **Rendered files:** `packages/motion/out/` is ignored by git. A video that ships with a site goes in `apps/<app>/public/media/` as H.264 MP4 with a poster image, at most 4 MB. Larger files go to object storage (ADR-0004).

## Remotion rules

### Determinism

Remotion renders each frame separately, so a frame must look the same every time it is drawn.

- Everything on screen is a function of `useCurrentFrame()` and `useVideoConfig()`.
- Inside a composition do not use CSS transitions or keyframes, Tailwind `transition-*` or `animate-*` classes, `requestAnimationFrame`, timers, `Date.now()` or `Math.random()`. For randomness use `random(seed)` from `remotion`.
- Animate with `interpolate()` (clamp both ends with `extrapolateLeft` and `extrapolateRight`) and `spring({ frame, fps })`.
- Write durations in seconds multiplied by `fps`, not as bare frame numbers.

### Compositions

- Each `<Composition>` sets `id`, `width`, `height`, `fps`, `durationInFrames` and `defaultProps`. Props are typed and JSON-serializable.
- Load images, video, audio and fonts through Remotion's own components and loaders, with files from `staticFile()`. A plain `<img>` or `<video>` does not make the render wait.
- Data fetched for a composition goes through `calculateMetadata`, or `delayRender()` with `continueRender()`.
- Colours and type come from the brand tokens, the same as the sites.

### Scene transitions

- Use `<TransitionSeries>` from `@remotion/transitions` with a presentation from `@remotion/transitions/<name>` and a timing (`linearTiming` or `springTiming`). Write a custom presentation only when no built-in one fits.
- Total length is the sum of the scenes minus the sum of the transitions. Compute `durationInFrames` from the same constants the scenes use.
- A transition cannot be longer than the scene before or after it, and two transitions cannot sit next to each other.
- Use at most two kinds of transition in one video.

### Player in the Next.js apps

- `<Player>` lives in a client component loaded with `next/dynamic` and `ssr: false`. It is never in a layout.
- Reserve its space with a fixed aspect ratio and show a poster until it loads, so the page does not shift.
- Memoize `inputProps` with `useMemo`. Keep fast-changing state (the current frame) out of the component that renders the Player; put controls in a sibling and pass the Player ref.
- Start playback from the visitor's click and pass the event to `play()`. No autoplay with sound.
- With `prefers-reduced-motion: reduce`, show the poster and controls and do not autoplay.

### Rendering

- Render from `packages/motion` with `npx remotion render <id>`.
- A composition that uses three.js renders with `--gl=angle` (or `chromiumOptions: { gl: "angle" }` in the API).

### Privacy

- A video rendered to a file contains no user data: no photos, measurements, names or journal text.
- A Player that draws the signed-in user's own data in their own browser is fine. Rendering user data on a server needs an ADR first (see ADR-0002).

## three.js rules

### Loading

- Write scenes declaratively with `@react-three/fiber`. Use imperative three.js only inside refs and hooks where performance needs it.
- Load a scene with `next/dynamic` and `ssr: false`. Draw a static poster or CSS fallback first, and mount the canvas when it scrolls into view or the browser is idle.
- The 3D chunk must not appear in the route's first-load JS in the `next build` output.
- Import by name (`import { Mesh } from "three"`), and add-ons from `three/addons/...`. Do not write `import * as THREE`.
- At most one canvas per page.

### Performance budget

- 60 FPS on a mid-range phone. If a scene cannot hold it there, simplify it or show the fallback on small devices.
- `dpr={[1, 2]}`. Use `frameloop="demand"` for a scene that does not animate continuously. Stop rendering when the canvas is off screen or the tab is hidden.
- At most 100 draw calls. Models are GLB compressed with Draco or Meshopt, at most 1.5 MB per scene. Textures are KTX2 or WebP, at most 2048px.
- In `useFrame`, do not allocate objects and do not call `setState`. Mutate refs.
- Dispose of every geometry, material and texture created imperatively when the component unmounts.
- No three.js scene on the live workout view while MediaPipe pose detection is running, unless a measurement shows both hold 30 FPS together.

### Accessibility and fallback

- A decorative canvas has `aria-hidden="true"`. A meaningful one has `role="img"` and an `aria-label`. Anything the scene tells the visitor is also available as text.
- With `prefers-reduced-motion: reduce`, show a single still frame.
- When WebGL is unavailable or the context is lost, show the fallback. The page still works.

### three.js inside Remotion

- Use `<ThreeCanvas>` from `@remotion/three` with `width` and `height` from `useVideoConfig()`.
- Drive animation with `useCurrentFrame()`. Do not use `useFrame()`.
- A `<Sequence>` inside `<ThreeCanvas>` needs `layout="none"`.

## Review checklist

Reviewer checks each item on any sprint that adds motion, video or 3D.

- [ ] The tool matches the table at the top. No new animation library.
- [ ] All Remotion packages are on one exact version.
- [ ] Player and canvas are loaded with `ssr: false` and are absent from first-load JS.
- [ ] No layout shift when the Player or canvas mounts.
- [ ] `prefers-reduced-motion` gives a still frame and no autoplay.
- [ ] The page works with WebGL disabled.
- [ ] Shipped media is within the size limits and holds no user data.
- [ ] The Remotion licence condition was confirmed with the human.
