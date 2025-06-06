// noinspection HtmlUnknownTarget
import { beforeEach, describe, test } from "node:test";
import { strictEqual } from "node:assert";

import { NodeHtmlMarkdown } from "../src";

/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

// Note: Newline handling for block elements within code blocks is not very clean. This can be fixed later.
describe(`Default Tags`, () => {
  let instance: NodeHtmlMarkdown;
  const translateAsBlock = (html: string) => instance.translate(`<pre><code>${html}</code></pre>`);
  const getExpected = (s: string) => "```\n" + s + "\n```";
  beforeEach(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`Line Break (br)`, () => {
    const res = translateAsBlock(`a<br>b`);
    strictEqual(res, getExpected(`a\nb`));
  });

  test(`Horizontal Rule (hr)`, () => {
    const res = translateAsBlock(`a<hr>b`);
    strictEqual(res, getExpected(`a\n\n---\n\nb`));
  });

  test(`Non-processed Elements (b, strong, del, s, strike, em, i, pre, code, blockquote, a)`, () => {
    const tags = ["b", "strong", "del", "s", "strike", "em", "i", "code", "a", "pre", "blockquote"];
    const html = tags.map((t) => `<${t}>${t}</${t}>`).join(" ");
    const exp = "b strong del s strike em i code a \n\npre\n\n blockquote\n\n";

    const res = translateAsBlock(html);
    strictEqual(res, getExpected(exp));
  });

  test(`Image (img)`, () => {
    const res = translateAsBlock(`a<img src="https://www.google.com/">b`);
    strictEqual(res, getExpected(`ab`));
  });

  test(`Headings (h1, h2, h3, h4, h5, h6)`, () => {
    let nodes: string[] = [];
    for (let i = 1; i < 8; i++) nodes.push(`<h${i}>a</h${i}>`);
    const res = translateAsBlock(nodes.join(""));
    strictEqual(res, getExpected("\n[a]\n".repeat(6) + "\na"));
  });

  // Note: Newline handling here for block elements is unusual
  describe(`Lists (ol + li, ul + li)`, () => {
    test(`Multi-level Ordered List`, () => {
      const res = translateAsBlock(`
        <ol>
          <li>a<br><br><s>b</s></li>
          <li> </li> <!-- Elided due to whitespace -->
          <li>b
            <ol><li>c<br>d</li></ol>
            <ul><li>e<br>f</li></ul>
          </li>
        </ol>
      `);
      strictEqual(
        res,
        getExpected(
          `        \n          \n1. a  \nb\n           \n          \n2. b  \n              \n   1. c  \n   d  \n              \n   * e  \n   f\n        \n      `
        )
      );
    });

    test(`Multi-level Unordered List`, () => {
      const res = translateAsBlock(`
        <ul>
          <li>a<br><br><s>b</s></li>
          <li> </li> <!-- Elided due to whitespace -->
          <li>b
            <ul><li>c<br>d</li></ul>
            <ol><li>e<br>f</li></ol>
          </li>
        </ul>
      `);
      strictEqual(
        res,
        getExpected(
          `        \n          \n* a  \nb\n           \n          \n* b  \n              \n   * c  \n   d  \n              \n   1. e  \n   f\n        \n      `
        )
      );
    });
  });

  test(`Table`, () => {
    const res = translateAsBlock("a<tr>b</tr>c<table><td>X</td></table>");
    strictEqual(res, getExpected(`a\nb\nc\n\nX\n\n`));
  });
});
