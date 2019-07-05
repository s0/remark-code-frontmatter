
import { Attacher, Transformer } from 'unified';
import visit = require('unist-util-visit');
import * as frontmatter from 'front-matter';

import { MDASTCode } from './types';

const attacher: Attacher = () =>  {

  const transformer: Transformer = (tree, _file) => {

    visit<MDASTCode>(tree, 'code', node => {
      if (frontmatter.test(node.value)) {
        const fm = frontmatter(node.value);
        node.frontmatter = fm.attributes;
        node.value = fm.body;
      }
    });

    return tree;
  };

  return transformer;
};

export = attacher;

