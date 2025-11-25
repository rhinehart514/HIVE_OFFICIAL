This directory contains experimental 3D landing components that depend on
`@react-three/*`, `three`, and related libraries.

For now, TypeScript errors from these files are silenced by excluding the
directory from the web `tsconfig.json`. The components themselves are not
critical to core product flows.

When revisiting 3D landing work:
- Re-enable typechecking by removing the `components/landing/3d` exclusion
  from `apps/web/tsconfig.json`.
- Install the appropriate React Three Fiber and `three` typings.
- Replace any `any`-typed JSX intrinsic elements with a proper `JSX.IntrinsicElements`
  augmentation for three.js primitives.

