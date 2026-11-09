// Lets this package type-check on its own; Next.js provides the same shape at build time.
declare module "*.png" {
  const content: import("next/dist/shared/lib/get-img-props").StaticImageData;
  export default content;
}
