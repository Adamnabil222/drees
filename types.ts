
export interface PredefinedModel {
  id: string;
  type: 'predefined';
  src: string;
  alt: string;
}

export interface CustomModel {
  id: 'custom';
  type: 'custom';
  src: File;
}

export type Model = PredefinedModel | CustomModel;
