
import {Attacher, Transformer} from 'unified';

const attacher: Attacher = () =>  {

  const transformer: Transformer = async (tree, _file) => {

    return tree;
  };

  return transformer;
};

export = attacher;

