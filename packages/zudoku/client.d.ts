/// <reference types="vite/client" />

declare module "*.yaml" {
  const src: string;
  export default src;
}
