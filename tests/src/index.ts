import { Transformer } from 'unified';
import visit = require('unist-util-visit');
import * as assert from 'assert';
import * as remark from 'remark';
import * as html from 'remark-html';
import { promisify } from 'util';
import * as codeExtra from 'remark-code-extra';

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

const TEST_MODIFICATION = `
\`\`\`c
---
wrap: c-main
---
printf("Hello, World!");
return 0;
\`\`\`

\`\`\`c
// Some other code
\`\`\`
`;

const TEST_MODIFICATION_HMTL = `
<pre><code class="language-c">#include&#x3C;stdio.h>
int main()
{
  printf("Hello, World!");
  return 0;
}
</code></pre>
<pre><code class="language-c">// Some other code
</code></pre>`.trim();

const TEST_EXTRA = `
\`\`\`
---
before: Some header text
---
Code block with a header
\`\`\`

\`\`\`
---
after: Some footer text
---
Code block with a footer
\`\`\`

\`\`\`
---
before: Some header text
after: Some footer text
---
Code block with a header and footer
\`\`\`

\`\`\`
Code block with no header or footer
\`\`\`
`;

const TEST_EXTRA_HMTL = `
<div class="code-extra">Some header text<pre><code>Code block with a header</code></pre></div>
<div class="code-extra"><pre><code>Code block with a footer</code></pre>Some footer text</div>
<div class="code-extra">Some header text<pre><code>Code block with a header and footer</code></pre>Some footer text</div>
<pre><code>Code block with no header or footer
</code></pre>
`.trim();

const TEST_COMBINED = TEST_NONE + TEST_EMPTY + TEST_SOME;

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
    assert.deepEqual(nodes[0].frontmatter, {});
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
  test('Combined', TEST_COMBINED, nodes => {
    assert.equal(nodes.length, 3);
    assert.deepEqual(nodes[0].frontmatter, {});
    assert.strictEqual(nodes[0].value, 'some code without frontmatter');
    assert.deepEqual(nodes[1].frontmatter, {});
    assert.strictEqual(nodes[1].value, 'some code with empty');
    assert.deepEqual(nodes[2].frontmatter, { foo: 'bar', baz: [1, 2, 3] });
    assert.strictEqual(nodes[2].value, 'some code with data');
  });
  it('Modification Test', async () => {
    const transformer: Transformer = tree => {
      visit<MDASTCode>(tree, 'code', node => {
        if (node.frontmatter.wrap === 'c-main') {
          node.value = [
            '#include<stdio.h>',
            'int main()',
            '{',
            // indent
            ...node.value.split('\n').map((line: string) => '  ' + line),
            `}`,
          ].join('\n');
        }
      });
      return tree;
    };

    const processor = remark()
      .use(codeFrontmatter)
      .use(() => transformer)
      .use(html);
    const output = await promisify(processor.process)(TEST_MODIFICATION);
    assert.equal(output.contents.trim(), TEST_MODIFICATION_HMTL);
  });
  it('Extra Test', async () => {
    const processor = remark()
      .use(codeFrontmatter)
      .use(codeExtra, {
        transform: (node: MDASTCode) => node.frontmatter.before || node.frontmatter.after ? {
          before: node.frontmatter.before && [{
            type: 'text',
            value: node.frontmatter.before
          }],
          after: node.frontmatter.after && [{
            type: 'text',
            value: node.frontmatter.after
          }]
        } : null
      })
      .use(html);
    const output = await promisify(processor.process)(TEST_EXTRA);
    assert.equal(output.contents.trim(), TEST_EXTRA_HMTL);
  });
});
