declare module "pdf-parse-debugging-disabled" {
  function pdf(data: Buffer | Uint8Array): Promise<{
    text: string;
    numpages: number;
    numrender: number;
  }>;

  export default pdf;
}
