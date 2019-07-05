import { Transformer } from 'unified';
import visit = require('unist-util-visit');
import * as assert from 'assert';
import * as remark from 'remark';
import { promisify } from 'util';

import { MDASTCode } from 'remark-code-frontmatter/types';
import * as codeFrontmatter from 'remark-code-frontmatter';

const TEST_NONE = `
\`\`\`
some code without frontmatter
\`\`\`
`;

const TEST_EMPTY = `
\`\`\`
---
---
some code with empty
\`\`\`
`;

const TEST_SOME = `
\`\`\`
---
foo: bar
baz: [1, 2, 3]
---
some code with data
\`\`\`
`;

function test(name: string, markdown: string, tests: (nodes: MDASTCode[]) => void) {
  it(name, async () => {
    const nodes: MDASTCode[] = [];

    const transformer: Transformer = tree => {
      visit<MDASTCode>(tree, 'code', node => nodes.push(node));
      return tree;
    };

    const processor = remark().use(codeFrontmatter).use(() => transformer);
    await promisify(processor.process)(markdown);
    tests(nodes);
  });
}

describe('main tests', () => {
  test('No frontmatter', TEST_NONE, nodes => {
    assert.equal(nodes.length, 1);
    assert.strictEqual(nodes[0].frontmatter, undefined);
    assert.strictEqual(nodes[0].value, 'some code without frontmatter');
  });
  test('Empty frontmatter', TEST_EMPTY, nodes => {
    assert.equal(nodes.length, 1);
    assert.deepEqual(nodes[0].frontmatter, {});
    assert.strictEqual(nodes[0].value, 'some code with empty');
  });
  test('Some frontmatter', TEST_SOME, nodes => {
    assert.equal(nodes.length, 1);
    assert.deepEqual(nodes[0].frontmatter, { foo: 'bar', baz: [1, 2, 3] });
    assert.strictEqual(nodes[0].value, 'some code with data');
  });
});
