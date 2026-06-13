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
      'A short motion study — movement, light, and rhythm beyond the still frame.',
    featured: true,
  },
  {
    id: 'sequence-02',
    fileName: 'Sequence 02.mp4',
    title: 'Sequence 02',
    description:
      'A second sequence from the same body of motion work.',
    featured: true,
  },
  {
    id: 'bird',
    fileName: 'Bird.mp4',
    title: 'Bird',
    description:
      'A brief clip of birdlife in motion.',
  },
];
