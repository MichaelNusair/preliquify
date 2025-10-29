export type BuildOptions = {
  srcDir: string;                 // e.g., "<theme>/src/snippets"
  outLiquidDir: string;           // e.g., "<theme>/snippets"
  outClientDir: string;           // e.g., "<theme>/assets"
  jsxImportSource?: string;       // default: "preact"
  watch?: boolean;
};

