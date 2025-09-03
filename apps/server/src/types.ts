export type ResumeSection = {
  title: string;
  content: string;
};

export type ParsedResume = {
  text: string;
  markdown: string;
  sections: ResumeSection[];
};

export type Snippet = { text: string; score: number };
