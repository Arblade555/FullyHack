// Loose module declaration for the Human Delta SDK.
//
// The `humandelta` npm package is young enough that its shipped types may
// shift between minor versions. We declare it as `any` at the import boundary
// so our wrapper compiles cleanly on machines where the package hasn't been
// installed yet, and so the real runtime surface isn't constrained by a stale
// declaration if the SDK changes shape.
//
// The actual fields we use are narrowed inside lib/humandelta.ts.
declare module "humandelta" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const HumanDelta: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _default: any;
  export default _default;
}
