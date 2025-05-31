import { describe, test, beforeEach } from "node:test";
import { strictEqual } from "node:assert";

import { NodeHtmlMarkdown } from "../src";

/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Table`, () => {
  let instance: NodeHtmlMarkdown;
  const translate = (html: string) => instance.translate(html);
  beforeEach(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`Single row, Single column table`, () => {
    const expected = `| col1 |\n| ---- |`;

    strictEqual(translate(`<table><tr><th>  col1 </th></tr></table>`), expected);
    strictEqual(translate(`<table><tr><td>  col1 </td></tr></table>`), expected);
    strictEqual(translate(`<table><td>  col1 </td></table>`), expected);
  });

  test(`Single row table`, () => {
    const expected = `| col1 | col2 |\n| ---- | ---- |`;

    strictEqual(translate(`<table><tr><th>  col1 </th><td>col2  </td></tr></table>`), expected);
    strictEqual(translate(`<table><tr><td>  col1 </td><td>col2  </td></table>`), expected);
    strictEqual(translate(`<table><td>  col1 </td><td>col2  </td></table>`), expected);
  });

  test(`Table with caption`, () => {
    const expected = `__Hello__\n` + `| col1 | col2 |\n` + `| ---- | ---- |`;

    strictEqual(translate(`<table><caption>Hello</caption><tr><th>  col1 </th><td>col2  </td></tr></table>`), expected);
    strictEqual(translate(`<table><th>  col1 </th><td>col2  </td><caption>Hello</caption></table>`), expected);
  });

  describe(`Special Cases`, () => {
    test(`"|" is escaped`, () => {
      strictEqual(translate(`<table><tr><td>A|B</td></tr></table>`), `| A\\|B |\n| ---- |`);
    });

    test(`Pads cells`, () => {
      const html = `<table>
        <tr><td>abc</td><td>def</td><td>ghi</td></tr>
        <tr><td>abc1</td><td>def123</td><td>ghi1234567</td></tr>
        <tr><td>a</td><td>def1234</td><td>c</td></tr>
      </table>`;
      const expected =
        `| abc  | def     | ghi        |\n` +
        `| ---- | ------- | ---------- |\n` +
        `| abc1 | def123  | ghi1234567 |\n` +
        `| a    | def1234 | c          |`;

      strictEqual(translate(html), expected);
    });

    test(`Nested tables are not supported`, () => {
      const html = `<table><tr><td><table><tr><td>nested</td></tr></table></td><td>abc</td></tr></table>`;
      strictEqual(translate(html), `| nested | abc |\n| ------ | --- |`);
    });

    test(`Supports inline tags + mismatched rows`, () => {
      const html = `
      <table>
        <thead>
          <tr>
            <th>COL1</th>
            <th>C
            O
            L2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th><b>b</b></th>
            <td><i>i</i></td>
            <td><a href="link">a</a></td>
            <td><img src="file"></td>
          </tr>
          <tr>
            <th><ul><li>list</li><li></li></ul></th>
            <td><hr></td>
            <td><h1>h1</h1></td>
          </tr>
        </tbody>
      </table>
    `;

      const expected =
        `| COL1  | C O L2 |           |           |\n` +
        `| ----- | ------ | --------- | --------- |\n` +
        `| **b** | _i_    | [a](link) | ![](file) |\n` +
        `| list  |        | h1        |           |`;

      strictEqual(translate(html), expected);
    });
  });
});
