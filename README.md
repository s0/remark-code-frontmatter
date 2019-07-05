# remark-code-frontmatter

[![Build Status](https://dev.azure.com/samlanning/general/_apis/build/status/remark-code-frontmatter?branchName=master)](https://dev.azure.com/samlanning/general/_build/latest?definitionId=8&branchName=master) [![Total alerts](https://img.shields.io/lgtm/alerts/g/samlanning/remark-code-frontmatter.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/samlanning/remark-code-frontmatter/alerts/) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/samlanning/remark-code-frontmatter.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/samlanning/remark-code-frontmatter/context:javascript) [![](https://img.shields.io/npm/v/remark-code-frontmatter.svg)](https://www.npmjs.com/package/remark-code-frontmatter)

Extract frontmatter from markdown code blocks using [remark][] and [front-matter][], and do interesting things!

For example:

* Add properties that add indentation to your code
* Add properties that indicate how the given code should wrap
* Add properties that specify links that should be attached to the HTML output of your code
* Add properties that specify which sort of syntx highlighting should be used
* Add properties that specify other ways in which HTML output should be manipulated

... The possibilities are endless!

This plugin is compatible with most [remark][] syntax highlighting plugins,
including [`remark-midas`](https://github.com/remarkjs/remark-midas),
[`remark-tree-sitter`](https://github.com/samlanning/tree-sitter) and
[`remark-highlight.js`](https://github.com/remarkjs/remark-highlight.js).
Just make sure that you use this plugin *before* the highlighting plugins.

You can also use this plugin with
[`remark-code-extra`](https://github.com/samlanning/remark-code-extra)
to use frontmatter data in additional HTML output for your code blocks.

## Install

[npm][]:

```sh
npm install remark-code-frontmatter
```

## Use

An additional field `frontmatter` is added to all code MDAST nodes for later use.

Say we have the following Markdown file, `example.md`:

````markdown
```c
---
wrap: c-main
---
printf("Hello, World!");
return 0;
```

```c
// Some other code
```
````

And our script, `example.js`, looks as follows:

```js
const vfile = require('to-vfile')
const report = require('vfile-reporter')
const unified = require('unified')
const visit = require('unist-util-visit');
const markdown = require('remark-parse')
const html = require('remark-html')
const codeFrontmatter = require('remark-code-frontmatter');

// Wrap code in boilerplate where neccesary
const transformer = tree => {
  visit(tree, 'code', node => {
    if (node.frontmatter.wrap === 'c-main') {
      node.value = [
        '#include<stdio.h>',
        'int main()',
        '{',
        // indent
        ...node.value.split('\n').map(line => '  ' + line),
        `}`,
      ].join('\n');
    }
  });
  return tree;
};

unified()
  .use(markdown)
  .use(codeFrontmatter)
  .use(() => transformer)
  .use(html)
  .process(vfile.readSync('example.md'), (err, file) => {
    console.error(report(err || file))
    console.log(String(file))
  })
```

Now, running `node example` yields:

```html
example.md: no issues found
<pre><code class="language-c">#include&#x3C;stdio.h>
int main()
{
  printf("Hello, World!");
  return 0;
}
</code></pre>
<pre><code class="language-c">// Some other code
</code></pre>
```

### Use with code highlighters

This plugin is compatible with most [remark][] syntax highlighting plugins,
including [`remark-midas`](https://github.com/remarkjs/remark-midas),
[`remark-tree-sitter`](https://github.com/samlanning/tree-sitter) and
[`remark-highlight.js`](https://github.com/remarkjs/remark-highlight.js).
Just make sure that you use this plugin *before* the highlighting plugins.

**Example:**

```js
unified()
  .use(markdown)
  .use(codeFrontmatter)
  .use(highlight) // comes AFTER codeFrontmatter, could be other highlighting plugins
  // Other plugins
  .use(html)
```

### Use with [`remark-code-extra`](https://github.com/samlanning/remark-code-extra)

You can access the markdown from within the transform function that you pass to the [options for that plugin](https://github.com/samlanning/remark-code-extra#optionstransform).

For example, if you had the following markdown:

````markdown
```
---
before: Some header text
---
Code block with a header
```

```
---
after: Some footer text
---
Code block with a footer
```

```
---
before: Some header text
after: Some footer text
---
Code block with a header and footer
```

```
Code block with no header or footer
```
````

And the following unified processor:

```js
// other imports
const codeFrontmatter = require('remark-code-frontmatter');
const codeExtra = require('remark-code-extra');

const processor = remark()
  .use(codeFrontmatter)
  .use(codeExtra, {
    transform: node => node.frontmatter.before || node.frontmatter.after ? {
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
```

Then this would output the following HTML:

```html
<div class="code-extra">Some header text<pre><code>Code block with a header</code></pre></div>
<div class="code-extra"><pre><code>Code block with a footer</code></pre>Some footer text</div>
<div class="code-extra">Some header text<pre><code>Code block with a header and footer</code></pre>Some footer text</div>
<pre><code>Code block with no header or footer
</code></pre>
```


## API

### `remark().use(codeFrontmatter)`

Extract frontmatter from markdown code blocks using [front-matter][].

## Related

*   [`remark-midas`](https://github.com/remarkjs/remark-midas)
    — Highlight CSS code blocks with midas (rehype compatible)
*   [`remark-tree-sitter`](https://github.com/samlanning/remark-tree-sitter)
    — Highlight code with tree-sitter (rehype compatible)
*   [`remark-highlight.js`](https://github.com/remarkjs/remark-highlight.js)
    — Highlight code with highlight.js (via lowlight)
*   [`remark-code-extra`](https://github.com/samlanning/remark-code-extra)
    — Add to or transform the HTML output of code blocks (rehype compatible)

<!-- Definitions -->

[front-matter]: https://github.com/jxson/front-matter

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/remarkjs/remark