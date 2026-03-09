export type VideoEntry = {
  id: string;
  fileName: string;
  title: string;
  description: string;
  featured?: boolean;
};

export const videoEntries: VideoEntry[] = [
  {
    id: 'sequence-01',
    fileName: 'Sequence 01 - (9x16) - (16x9).mp4',
    title: 'Sequence 01',
    description:
      'A motion study published from the R2 video archive and embedded into the portfolio.',
    featured: true,
  },
  {
    id: 'sequence-02',
    fileName: 'Sequence 02.mp4',
    title: 'Sequence 02',
    description:
      'A second published clip from the R2-backed video archive for NiazPhotography.',
    featured: true,
  },
];
