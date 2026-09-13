// @ts-ignore
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  minify: true,
  sourcemap: 'none',
  splitting: false,
});
