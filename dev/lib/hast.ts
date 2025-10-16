import type {Nodes as MdastNodes} from 'mdast'
import type {Handlers, State} from 'mdast-util-to-hast'
import {
  type Table,
  type TableCell,
  type HastElement,
  type HastElementContent,
  transData
} from './types.js'

/**
 * @import {Table, TableCell, HastElement, HastElementContent} from "./types.js"
 * @import {Handlers, State} from "mdast-util-to-hast"
 * @import {Nodes as MdastNodes} from 'mdast'
 */

/**
 * Honor the `data` of `node` and maybe generate an hast element.
 *
 * @param {State} state
 *   Info passed around.
 * @param {MdastNodes} node
 *   mdast node to use data from.
 * @param {boolean} wrap
 *   wrap children.
 * @returns {HastElement}
 *   Nothing.
 */
function applyData(state: State, node: MdastNodes, wrap: boolean): HastElement {
  // Transforming the node resulted in a non-element, which happens for
  // raw, text, and root nodes (unless custom handlers are passed).
  /** @type {Array<HastElementContent>} */
  let children: Array<HastElementContent> = []
  children = state.all(node)
  if (wrap) {
    children = state.wrap(children, true)
  }

  /** @type {HastElement} */
  const result: HastElement = {
    type: 'element',
    tagName: '',
    properties: {},
    children
  }
  state.patch(node, result)
  // Handle `data.hName`, `data.hProperties, `data.hChildren`.
  if (node.data) {
    const data = transData(node.data)
    const hName = data.hName
    const hChildren = data.hChildren
    const hProperties = data.hProperties

    if (typeof hName === 'string') {
      result.tagName = hName
    }

    if (hProperties) {
      Object.assign(result.properties, structuredClone(hProperties))
    }

    /* c8 ignore start */
    if (
      'children' in result &&
      result.children &&
      hChildren !== null &&
      hChildren !== undefined
    ) {
      result.children = hChildren
    }
    /* c8 ignore stop */
  }

  return result
}

/**
 * Turn an mdast `table|tableHead|tableBody|tableRow` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Table} node
 *   mdast node.
 * @returns {HastElementContent}
 *   hast node.
 */
function table(state: State, node: Table): HastElementContent {
  return applyData(state, node, true)
}

/**
 * Turn an mdast `tableCell` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {TableCell} node
 *   mdast node.
 * @returns {HastElementContent}
 *   hast node.
 */
function tableCell(state: State, node: TableCell): HastElementContent {
  // Note: this function is normally not called: see `table-row` for how rows
  // and their cells are compiled.
  return applyData(state, node, false)
}

/**
 * Redefine hast Handlers for table, tableRow, tableCell.
 *
 * @returns {Handlers}
 *   hast handlers.
 */
export function gfmTableHastHandlers(): Handlers {
  return {
    table,
    tableHead: table,
    tableBody: table,
    tableRow: table,
    tableCell
  }
}
