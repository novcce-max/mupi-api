export type ContentChannel = 'baike' | 'mupi' | 'wenti';

export type ContentAiGenerateInput = {
  channel: ContentChannel;
  title: string;
  brief?: string;
  slugHint?: string;
};

export type ContentAiGeneratedPayload = {
  title: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  content: unknown;
  provider: string;
  model?: string;
};

export interface ContentAiProvider {
  generate(input: ContentAiGenerateInput): Promise<ContentAiGeneratedPayload>;
}
