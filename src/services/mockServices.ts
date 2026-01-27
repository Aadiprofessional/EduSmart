
export const userService = {};
export const intelligentImageStorage = {};
export const streamingImageService = {};
export const imageReplacementService = { initializeSession: (sessionId: string, userId: string) => {}, cleanupSession: (sessionId: string) => {} };
export const documentProcessingService = {};
export const chartService = { renderChart: (id: string, config: any) => {}, parseChartJsHtml: (html: string) => null };
export type ChartConfig = any;
export interface StreamChunk { text: string; }
