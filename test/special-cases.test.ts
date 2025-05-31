import { describe, test, beforeEach } from "node:test";
import { strictEqual } from "node:assert";

import { NodeHtmlMarkdown } from "../src";

/* ****************************************************************************************************************** *
 * Config
 * ****************************************************************************************************************** */

const textFormatTags = ["strong", "b", "del", "s", "strike", "em", "i"] as const;
const getDelims = (instance: NodeHtmlMarkdown) =>
  Object.fromEntries(
    textFormatTags.map((t) => [
      t,
      (() => {
        switch (t) {
          case "strong":
          case "b":
            return instance.options.strongDelimiter;
          case "del":
          case "s":
          case "strike":
            return instance.options.strikeDelimiter;
          case "em":
          case "i":
            return instance.options.emDelimiter;
        }
      })(),
    ])
  );

/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Special Cases`, () => {
  let instance: NodeHtmlMarkdown;
  let delims: ReturnType<typeof getDelims>;
  const translate = (html: string) => instance.translate(html);
  beforeEach(() => {
    instance = new NodeHtmlMarkdown();
    delims = getDelims(instance);
  });

  test(`Removes uncaught Doctype`, () => {
    const res = translate(`<!DOCTYPE html>abc`);
    strictEqual(res, `abc`);
  });

  describe(`Whitespace handled for leading / trailing whitespace in tags`, () => {
    textFormatTags.forEach((tag) => {
      test(`Whitespace Test tag: ${tag}`, () => {
        const delim = delims[tag];
        strictEqual(translate(`<p><${tag}> &nbsp;Label:&nbsp; </${tag}>Value</p>`), ` ${delim}Label:${delim} Value`);
        strictEqual(translate(`<p><${tag}>&nbsp; Label: &nbsp;</${tag}>Value</p>`), ` ${delim}Label:${delim} Value`);
      });
    });
  });

  // See: https://github.com/crosstype/node-html-markdown/issues/18
  describe(`Removes nested text formatting tags`, () => {
    textFormatTags.forEach((tag) => {
      test(`Removes Test tag: ${tag}`, () => {
        const delim = delims[tag];
        strictEqual(translate(`<${tag}>My <${tag}>bold</${tag}> text</${tag}>`), `${delim}My bold text${delim}`);
      });
    });
  });

  // See: https://github.com/crosstype/node-html-markdown/issues/16
  // See: https://github.com/crosstype/node-html-markdown/issues/21
  test(`Handles whitespace with single space`, () => {
    const res = translate(
      `<span>test</span>  <span>test2 </span>\n<span>test3</span>\r\n\r\n\t\t\t<span>test4</span>\t<span>test5\r\n\n\n\t\ttest6</span>`
    );
    strictEqual(res, `test test2 test3 test4 test5 test6`);
  });

  // See: https://github.com/crosstype/node-html-markdown/issues/19
  test(`Childless nodes visited if preserveIfEmpty set`, () => {
    const html = `<span>Hello</span><iframe src="https://radio4000.com"/><span>World</span>`;

    let res = NodeHtmlMarkdown.translate(html, void 0, { iframe: { content: "[iframe]" } });
    strictEqual(res, `HelloWorld`);

    res = NodeHtmlMarkdown.translate(html, void 0, { iframe: { content: "[iframe]", preserveIfEmpty: true } });
    strictEqual(res, `Hello[iframe]World`);
  });

  // See: https://github.com/crosstype/node-html-markdown/issues/20
  // See: https://github.com/crosstype/node-html-markdown/issues/22
  test(`Code blocks preserve whitespace & decode entities`, () => {
    const html =
      `<pre><code><span><span class="comment">// &gt; Get URL Path</span></span>\n` +
      `<span><span class="declaration">function getURL(s: string): string {\n</span></span>` +
      `<span>    <span class="return">return</span> \`https://myurl.com/\${s}\`;</span>\n` +
      `<span>}</span>` +
      `</pre></code>`;
    const expected =
      "```\n" +
      `// > Get URL Path\n` +
      `function getURL(s: string): string {\n` +
      `    return \`https://myurl.com/\${s}\`;\n` +
      `}\n` +
      "```";

    const res = translate(html);
    strictEqual(res, expected);
  });
});
