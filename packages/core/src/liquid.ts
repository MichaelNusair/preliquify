// helpers to safely emit Liquid and JSON blobs
export const rawLiquid = (s: string) => s;
export const liquidJson = (obj: any) => `{{ ${JSON.stringify(obj)} | json }}`;

