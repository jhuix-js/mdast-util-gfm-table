import type {Element, ElementContent, Properties} from 'hast'
import type {Data, PhrasingContent, Parent} from 'mdast'
import type {Node, Parent as UnistParent} from 'unist'
import type {Options as MarkdownTableOptions} from 'markdown-table'

export type HastElementContent = ElementContent
export type HastElement = Element
export type HastProperties = Properties

/**
 * Configuration.
 */
export interface Options {
  /**
   * Whether to add a space of padding between delimiters and cells (default: `true`).
   */
  tableCellPadding?: boolean | undefined
  /**
   * Whether to align the delimiters (default: `true`).
   */
  tablePipeAlign?: boolean | undefined
  /**
   * Function to detect the length of table cell content, used when aligning
   * the delimiters between cells (optional).
   */
  stringLength?: MarkdownTableOptions['stringLength'] | undefined
}

/**
 * How phrasing content is aligned
 * ({@link https://drafts.csswg.org/css-text/ | [CSSTEXT]}).
 *
 * * `'left'`: See the
 *   {@link https://drafts.csswg.org/css-text/#valdef-text-align-left | left}
 *   value of the `text-align` CSS property
 * * `'right'`: See the
 *   {@link https://drafts.csswg.org/css-text/#valdef-text-align-right | right}
 *   value of the `text-align` CSS property
 * * `'center'`: See the
 *   {@link https://drafts.csswg.org/css-text/#valdef-text-align-center | center}
 *   value of the `text-align` CSS property
 * * `'none'`: phrasing content is aligned as defined by the host environment
 *
 * Used in tables.
 */
export type Align = 'center' | 'left' | 'right' | 'none'

/**
 * Markdown GFM table row.
 */
export interface TableRow extends Parent {
  /**
   * Node type of mdast GFM table row.
   */
  type: 'tableRow'
  /**
   * Children of GFM table row.
   */
  children: Array<TableCell>
  /**
   * Data associated with the mdast GFM table row.
   */
  data?: TableRowData | undefined
}

/**
 * Info associated with mdast GFM table row nodes by the ecosystem.
 */
export interface TableRowData extends Data {}

/**
 * Markdown GFM table cell.
 */
export interface TableCell extends Parent {
  /**
   * Node type of mdast GFM table cell.
   */
  type: 'tableCell'
  /**
   * Children of GFM table cell.
   */
  children: Array<PhrasingContent>
  /**
   * Data associated with the mdast GFM table cell.
   */
  data?: TableCellData | undefined
  colspan?: number
  rowspan?: number
}

/**
 * Info associated with mdast GFM table cell nodes by the ecosystem.
 */
export interface TableCellData extends Data {}

/**
 * Markdown GFM table head.
 */
export interface TableHead extends Parent {
  /**
   * Node type of mdast GFM table head.
   */
  type: 'tableHead'
  /**
   * Children of GFM table head.
   */
  children: Array<TableRow>
  /**
   * Data associated with the mdast GFM table head.
   */
  data?: TableHeadData | undefined
}

/**
 * Info associated with mdast GFM table head nodes by the ecosystem.
 */
export interface TableHeadData extends Data {}

/**
 * Markdown GFM table body.
 */
export interface TableBody extends Parent {
  /**
   * Node type of mdast GFM table body.
   */
  type: 'tableBody'
  /**
   * Children of GFM table body.
   */
  children: Array<TableRow>
  /**
   * Data associated with the mdast GFM table body.
   */
  data?: TableBodyData | undefined
}

/**
 * Info associated with mdast GFM table body nodes by the ecosystem.
 */
export interface TableBodyData extends Data {}

export type {Table} from 'mdast'

export const mdastTypes = {
  tableHead: 'tableHead' as const,
  tableBody: 'tableBody' as const,
  tableColspanRight: 'tableColspanRight' as const,
  tableColspanLeft: 'tableColspanLeft' as const,
  tableRowspan: 'tableRowspan' as const
}

export interface TableHeadNode extends UnistParent {
  type: 'tableHead'
}
export interface TableBodyNode extends UnistParent {
  type: 'tableBody'
}
export interface TableColspanRightNode extends Node {
  type: 'tableColspanRight'
}
export interface TableColspanLeftNode extends Node {
  type: 'tableColspanLeft'
}
export interface TableRowspanNode extends Node {
  type: 'tableRowspan'
}

/**
 * Augment types.
 */
declare module 'micromark-util-types' {
  /**
   * Augment token;
   * `align` is patched on `table` tokens by
   * `micromark-extension-gfm-table`.
   */
  interface Token {
    /**
     * Alignment of current table.
     */
    _align?: Array<Align> | undefined
  }
}

declare module 'mdast' {
  interface Data {
    /**
     * Field supported by `mdast-util-to-hast` to signal that a node should
     * result in something with these children.
     *
     * When this is defined, when a parent is created, these children will
     * be used.
     */
    hChildren?: Array<ElementContent> | undefined

    /**
     * Field supported by `mdast-util-to-hast` to signal that a node should
     * result in a particular element, instead of its default behavior.
     *
     * When this is defined, an element with the given tag name is created.
     * For example, when setting `hName` to `'b'`, a `<b>` element is created.
     */
    hName?: string | undefined

    /**
     * Field supported by `mdast-util-to-hast` to signal that a node should
     * result in an element with these properties.
     *
     * When this is defined, when an element is created, these properties will
     * be used.
     */
    hProperties?: Properties | undefined
  }
  interface RootContentMap {
    tableHead: TableHeadNode
    tableBody: TableBodyNode
    tableColspanLeft: TableColspanLeftNode
    tableColspanRight: TableColspanRightNode
    tableRowspan: TableRowspanNode
  }
  interface PhrasingContentMap {
    tableHead: TableHeadNode
    tableBody: TableBodyNode
    TableColspanLeft: TableColspanLeftNode
    TableColspanRight: TableColspanRightNode
    tableRowspan: TableRowspanNode
  }
  interface TableContentMap {
    tableHead: TableHead
    tableBody: TableBody
  }
}

// Add custom data tracked to turn markdown into a tree.
declare module 'mdast-util-from-markdown' {
  interface CompileData {
    /**
     * Whether we’re currently in a table.
     */
    inTable?: boolean | undefined
    /**
     * Whether we’re currently in table cell.
     */
    inTableCell?: boolean | undefined
  }
}

// Add custom data tracked to turn a syntax tree into markdown.
declare module 'mdast-util-to-markdown' {
  interface ConstructNameMap {
    /**
     * Whole table.
     *
     * ```markdown
     * > | | a |
     *     ^^^^^
     * > | | - |
     *     ^^^^^
     * ```
     */
    table: 'table'

    /**
     * Table cell.
     *
     * ```markdown
     * > | | a |
     *     ^^^^^
     *   | | - |
     * ```
     */
    tableCell: 'tableCell'

    /**
     * Table row.
     *
     * ```markdown
     * > | | a |
     *     ^^^^^
     *   | | - |
     * ```
     */
    tableRow: 'tableRow'

    tableHead: 'tableHead'

    tableBody: 'tableBody'
  }
}

export function transData(v: Data): Data {
  return v
}
