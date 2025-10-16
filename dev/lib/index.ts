import {ok as assert} from 'devlop'
import {visit} from 'unist-util-visit'
import {markdownTable} from 'markdown-table'
import {
  defaultHandlers,
  type Options as ToMarkdownExtension,
  type State,
  type Info
} from 'mdast-util-to-markdown'
import type {InlineCode, Parents, Root, Text, AlignType} from 'mdast'
import type {
  CompileContext,
  Extension as FromMarkdownExtension,
  Token
} from 'mdast-util-from-markdown'
import {
  type Options,
  type Table,
  type TableCell,
  type TableRow,
  mdastTypes
} from './types.js'

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM tables in
 * markdown.
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable GFM tables.
 */
export function gfmTableFromMarkdown(): FromMarkdownExtension {
  return {
    enter: {
      table: enterTable,
      tableData: enterCell,
      tableRow: enterRow,
      tableBody: enterBody,
      tableHead: enterHead,
      tableHeader: enterHeader,
      tableColspanLeftMarker: enterColspanLeftMarker,
      tableColspanRightMarker: enterColspanRightMarker,
      tableRowspanMarker: enterRowspanMarker
    },
    exit: {
      codeText: exitCodeText,
      table: exitTable,
      tableData: exit,
      tableRow: exit,
      tableBody: exitSection,
      tableHead: exitSection,
      tableHeader: exit,
      tableColspanLeftMarker: exit,
      tableColspanRightMarker: exit,
      tableRowspanMarker: exit
    },
    transforms: [transformTable]
  }

  function enterTable(this: CompileContext, token: Token) {
    const align = token._align
    assert(align, 'expected `_align` on table')
    this.enter(
      {
        type: 'table',
        align: align.map(function (d) {
          return d === 'none' ? null : d
        }),
        children: [],
        data: {
          hName: 'table'
        }
      },
      token
    )
    this.data.inTable = true
  }

  function exitTable(this: CompileContext, token: Token) {
    this.exit(token)
    this.data.inTable = undefined
  }

  function enterRow(this: CompileContext, token: Token) {
    this.enter({type: 'tableRow', children: [], data: {hName: 'tr'}}, token)
  }

  function exit(this: CompileContext, token: Token) {
    this.exit(token)
  }

  function enterCell(this: CompileContext, token: Token) {
    this.enter({type: 'tableCell', children: [], data: {hName: 'td'}}, token)
  }

  function enterHead(this: CompileContext, token: Token) {
    this.enter({type: 'tableHead', children: [], data: {hName: 'thead'}}, token)
    this.data.inTableCell = true
  }

  function enterHeader(this: CompileContext, token: Token) {
    this.enter({type: 'tableCell', children: [], data: {hName: 'th'}}, token)
  }

  function enterBody(this: CompileContext, token: Token) {
    this.enter({type: 'tableBody', children: [], data: {hName: 'tbody'}}, token)
    this.data.inTableCell = true
  }

  function enterColspanRightMarker(this: CompileContext, token: Token) {
    if (this.data.inTableCell) {
      this.enter({type: 'tableColspanRight'}, token)
    }
  }

  function enterColspanLeftMarker(this: CompileContext, token: Token) {
    if (this.data.inTableCell) {
      this.enter({type: 'tableColspanLeft'}, token)
    }
  }

  function enterRowspanMarker(this: CompileContext, token: Token) {
    if (this.data.inTableCell) {
      this.enter({type: 'tableRowspan'}, token)
    }
  }

  // Overwrite the default code text data handler to unescape escaped pipes when
  // they are in tables.
  function exitCodeText(this: CompileContext, token: Token) {
    let value = this.resume()

    if (this.data.inTable) {
      value = value.replace(/\\([\\|])/g, replace)
    }

    const node = this.stack[this.stack.length - 1]
    assert(node.type === 'inlineCode')
    node.value = value
    this.exit(token)
  }

  function exitSection(this: CompileContext, token: Token) {
    this.exit(token)
    this.data.inTableCell = undefined
  }

  /**
   * @param {string} a
   * @param {string} b
   * @returns {string}
   */
  function replace(a: string, b: string): string {
    // Pipes work, backslashes don’t (but can’t escape pipes).
    return b === '|' ? b : a
  }

  function processSpanMarkers(table: Table) {
    const align = table.align
    assert(align, 'expected `align` on table')
    for (let m = table.children.length - 1; m >= 0; m--) {
      const toBeDeleted: Array<[number, number]> = []
      const rows = table.children[m]
      /* c8 ignore next */
      if (rows.type === 'tableRow') continue
      for (let i = rows.children.length - 1; i >= 0; i--) {
        const row = rows.children[i]
        for (let j = row.children.length - 1; j >= 0; j--) {
          const cell = row.children[j]
          if (align[j]) {
            /* c8 ignore next 2 */
            const data = cell.data ?? (cell.data = {})
            const properties = data.hProperties ?? (data.hProperties = {})
            properties.align = align[j]
          }

          if (cell.children.length !== 1) continue

          switch (cell.children[0].type) {
            case mdastTypes.tableColspanRight: {
              if (j >= row.children.length - 1) {
                marker2text(cell)
                break
              }

              for (let k = 1; j + k < row.children.length; k++) {
                const next = row.children[j + k]
                /* c8 ignore next 2 */
                const data = next.data ?? (next.data = {})
                const properties = data.hProperties ?? (data.hProperties = {})
                properties.colspan = (next.colspan ?? 1) + 1
                next.colspan = properties.colspan
                if (!isCellColspanRight(next)) break
              }

              toBeDeleted.push([i, j])
              break
            }

            case mdastTypes.tableRowspan: {
              if (i < 1) {
                marker2text(cell)
                break
              }

              const previous = rows.children[i - 1].children[j]
              /* c8 ignore next 2 */
              const data = previous.data ?? (previous.data = {})
              const properties = data.hProperties ?? (data.hProperties = {})
              properties.rowspan = (previous.rowspan ?? 1) + (cell.rowspan ?? 1)
              previous.rowspan = properties.rowspan
              toBeDeleted.push([i, j])
              break
            }

            case mdastTypes.tableColspanLeft: {
              if (j < 1 || isCellColspanRight(row.children[j - 1])) {
                // Behave as a normal empty cell when conflicting with colspanWithRight marker
                marker2text(cell)
                break
              }

              /* c8 ignore next 2 */
              const data =
                row.children[j - 1].data ?? (row.children[j - 1].data = {})
              const properties = data.hProperties ?? (data.hProperties = {})
              properties.colspan =
                (row.children[j - 1].colspan ?? 1) + (cell.colspan ?? 1)
              row.children[j - 1].colspan = properties.colspan
              toBeDeleted.push([i, j])
              break
            }

            default: {
              break
            }
          }
        }
      }

      for (const point of toBeDeleted) {
        const [i, j] = point
        rows.children[i].children.splice(j, 1)
      }
    }
  }

  function transformTable(tree: Root): Root {
    visit(tree, 'table', (node: Table) => {
      // Create empty cell node
      if (node.align) {
        for (const rows of node.children) {
          /* c8 ignore next */
          if (rows.type === 'tableRow') continue
          for (const row of rows.children) {
            const currSize = row.children.length
            for (let i = 0; i < node.align.length - currSize; i++) {
              row.children.push(makeCell())
            }
          }
        }
      }

      // Process span markers
      processSpanMarkers(node)
    })
    return tree
  }

  function makeCell(): TableCell {
    return {
      type: 'tableCell',
      children: [],
      data: {hName: 'td'}
    }
  }

  function marker2text(cell: TableCell) {
    /* c8 ignore next 3 */
    if (cell.children.length !== 1) {
      return
    }

    let text = ''
    switch (cell.children[0].type) {
      case mdastTypes.tableColspanRight: {
        text = '>'
        break
      }

      case mdastTypes.tableRowspan: {
        text = '^'
        break
      }

      case mdastTypes.tableColspanLeft: {
        text = ''
        break
      }

      /* c8 ignore next 3 */
      default: {
        break
      }
    }

    if (text === '') {
      cell.children.splice(0, 1)
    } else {
      const textNode: Text = {
        type: 'text',
        value: text,
        position: cell.children[0].position
      }
      cell.children.splice(0, 1, textNode)
    }
  }

  function isCellColspanRight(cell: TableCell): boolean {
    /* c8 ignore next 3 */
    if (cell.children.length !== 1) {
      return false
    }

    const cellContent = cell.children[0]
    return cellContent.type === 'tableColspanRight'
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM tables in
 * markdown.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM tables.
 */
export function gfmTableToMarkdown(
  options?: Options | null | undefined
): ToMarkdownExtension {
  const settings = options ?? {}
  const padding = settings.tableCellPadding
  const alignDelimiters = settings.tablePipeAlign
  const stringLength = settings.stringLength
  const around = padding ? ' ' : '|'

  return {
    unsafe: [
      {character: '\r', inConstruct: 'tableCell'},
      {character: '\n', inConstruct: 'tableCell'},
      // A pipe, when followed by a tab or space (padding), or a dash or colon
      // (unpadded delimiter row), could result in a table.
      {atBreak: true, character: '|', after: '[\t :-]'},
      // A pipe in a cell must be encoded.
      {character: '|', inConstruct: 'tableCell'},
      // A colon must be followed by a dash, in which case it could start a
      // delimiter row.
      {atBreak: true, character: ':', after: '-'},
      // A delimiter row can also start with a dash, when followed by more
      // dashes, a colon, or a pipe.
      // This is a stricter version than the built in check for lists, thematic
      // breaks, and setex heading underlines though:
      // <https://github.com/syntax-tree/mdast-util-to-markdown/blob/51a2038/lib/unsafe.js#L57>
      {atBreak: true, character: '-', after: '[:|-]'}
    ],
    handlers: {
      inlineCode: inlineCodeWithTable,
      table: handleTable,
      tableCell: handleTableCell,
      tableRow: handleTableRow
    }
  }

  function handleTable(
    node: Table,
    _: Parents | undefined,
    state: State,
    info: Info
  ): string {
    return serializeData(handleTableAsData(node, state, info), node.align)
  }

  /**
   * This function isn’t really used normally, because we handle rows at the
   * table level.
   * But, if someone passes in a table row, this ensures we make somewhat sense.
   *
   * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
   * @type {ToMarkdownHandle}
   * @param {TableRow} node
   */
  function handleTableRow(
    node: TableRow,
    _: Parents | undefined,
    state: State,
    info: Info
  ): string {
    const row = handleTableRowAsData(node, state, info)
    const value = serializeData([row])
    // `markdown-table` will always add an align row
    return value.slice(0, value.indexOf('\n'))
  }

  function handleTableCell(
    node: TableCell,
    _: Parents | undefined,
    state: State,
    info: Info
  ): string {
    const exit = state.enter('tableCell')
    const subexit = state.enter('phrasing')
    const value = state.containerPhrasing(node, {
      ...info,
      before: around,
      after: around
    })
    subexit()
    exit()
    return value
  }

  /**
   * @param {Array<Array<string>>} matrix
   * @param {Array<string | null | undefined> | null | undefined} [align]
   */
  function serializeData(
    matrix: Array<Array<string>>,
    align?: Array<AlignType> | null | undefined
  ) {
    return markdownTable(matrix, {
      align,
      alignDelimiters,
      padding,
      stringLength
    })
  }

  /**
   * @param {Table} node
   * @param {State} state
   * @param {Info} info
   */
  function handleTableAsData(
    node: Table,
    state: State,
    info: Info
  ): Array<Array<string>> {
    const secs = node.children
    let index = -1
    const result: Array<Array<string>> = []
    const subexit = state.enter('table')
    for (const sec of secs) {
      if (sec.type === 'tableRow') {
        ++index
        result[index] = handleTableRowAsData(sec, state, info)
        continue
      }

      let j = -1
      const children = sec.children
      while (++j < children.length) {
        ++index
        result[index] = handleTableRowAsData(children[j], state, info)
      }
    }

    subexit()
    return result
  }

  /**
   * @param {TableRow} node
   * @param {State} state
   * @param {Info} info
   */
  function handleTableRowAsData(
    node: TableRow,
    state: State,
    info: Info
  ): Array<string> {
    const children = node.children
    let index = -1
    const result: Array<string> = []
    const subexit = state.enter('tableRow')

    while (++index < children.length) {
      // Note: the positional info as used here is incorrect.
      // Making it correct would be impossible due to aligning cells?
      // And it would need copy/pasting `markdown-table` into this project.
      result[index] = handleTableCell(children[index], node, state, info)
    }

    subexit()

    return result
  }

  /**
   * @type {ToMarkdownHandle}
   * @param {InlineCode} node
   */
  function inlineCodeWithTable(
    node: InlineCode,
    parent: Parents | undefined,
    state: State
  ) {
    let value = defaultHandlers.inlineCode(node, parent, state)

    if (state.stack.includes('tableCell')) {
      value = value.replace(/\|/g, '\\$&')
    }

    return value
  }
}
