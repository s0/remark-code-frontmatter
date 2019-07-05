import { Node } from 'unist';

export interface MDASTCode extends Node {
  lang?: string;
  meta: null | string;
  value: string;
  frontmatter?: any;
}
