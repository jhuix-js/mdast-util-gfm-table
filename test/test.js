/**
 * @typedef {import('mdast').Table} Table
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import stringWidth from 'string-width'
import {fromMarkdown as mdastFromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'
import {gfmTableFromMarkdown, gfmTableToMarkdown} from '../index.js'
import {gfmTable} from '../../micromark-extension-gfm-table/index.js'

function fromMarkdown(value, encoding, options) {
  const tree = mdastFromMarkdown(value, encoding, options)
  // Console.log('the tree:', JSON.stringify(tree))
  return tree
}

test('core', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../index.js')).sort(), [
      'gfmTableFromMarkdown',
      'gfmTableToMarkdown'
    ])
  })
})

test('gfmTableFromMarkdown()', async function (t) {
  await t.test('should support tables (0)', async function () {
    const tree = fromMarkdown(
      '| a | b | c | d |\n| - | :- | -: | :-: |\n| e | f |\n| g | h | i | j | k |',
      {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()]
      }
    )

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'table',
          align: [null, 'left', 'right', 'center'],
          children: [
            {
              type: 'tableHead',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'a'}],
                      data: {hName: 'th'}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'b'}],
                      data: {hName: 'th', hProperties: {align: 'left'}}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'c'}],
                      data: {hName: 'th', hProperties: {align: 'right'}}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'd'}],
                      data: {hName: 'th', hProperties: {align: 'center'}}
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'thead'}
            },
            {
              type: 'tableBody',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'e'}],
                      data: {hName: 'td'}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'f'}],
                      data: {hName: 'td', hProperties: {align: 'left'}}
                    },
                    {
                      type: 'tableCell',
                      children: [],
                      data: {hProperties: {align: 'right'}}
                    },
                    {
                      type: 'tableCell',
                      children: [],
                      data: {hProperties: {align: 'center'}}
                    }
                  ],
                  data: {hName: 'tr'}
                },
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'g'}],
                      data: {hName: 'td'}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'h'}],
                      data: {hName: 'td', hProperties: {align: 'left'}}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'i'}],
                      data: {hName: 'td', hProperties: {align: 'right'}}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'j'}],
                      data: {hName: 'td', hProperties: {align: 'center'}}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'k'}],
                      data: {hName: 'td'}
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'tbody'}
            }
          ],
          data: {hName: 'table'}
        }
      ]
    })
  })

  await t.test('should support tables (1)', async function () {
    const tree = fromMarkdown('| foo | bar |\n| :-- | :-: |\n| baz | qux |', {
      extensions: [gfmTable()],
      mdastExtensions: [gfmTableFromMarkdown()]
    })

    removePosition(tree, {force: true})
    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'table',
          align: ['left', 'center'],
          children: [
            {
              type: 'tableHead',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'foo'}],
                      data: {hName: 'th', hProperties: {align: 'left'}}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'bar'}],
                      data: {hName: 'th', hProperties: {align: 'center'}}
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'thead'}
            },
            {
              type: 'tableBody',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'baz'}],
                      data: {hName: 'td', hProperties: {align: 'left'}}
                    },
                    {
                      type: 'tableCell',
                      children: [{type: 'text', value: 'qux'}],
                      data: {hName: 'td', hProperties: {align: 'center'}}
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'tbody'}
            }
          ],
          data: {hName: 'table'}
        }
      ]
    })
  })

  await t.test('should support tables', async function () {
    assert.deepEqual(
      fromMarkdown('| a\n| -', {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()]
      }),
      {
        type: 'root',
        children: [
          {
            type: 'table',
            align: [null],
            children: [
              {
                type: 'tableHead',
                children: [
                  {
                    type: 'tableRow',
                    children: [
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'text',
                            value: 'a',
                            position: {
                              start: {line: 1, column: 3, offset: 2},
                              end: {line: 1, column: 4, offset: 3}
                            }
                          }
                        ],
                        data: {hName: 'th'},
                        position: {
                          start: {line: 1, column: 1, offset: 0},
                          end: {line: 1, column: 4, offset: 3}
                        }
                      }
                    ],
                    data: {hName: 'tr'},
                    position: {
                      start: {line: 1, column: 1, offset: 0},
                      end: {line: 1, column: 4, offset: 3}
                    }
                  }
                ],
                data: {hName: 'thead'},
                position: {
                  start: {line: 1, column: 1, offset: 0},
                  end: {line: 2, column: 4, offset: 7}
                }
              }
            ],
            data: {hName: 'table'},
            position: {
              start: {line: 1, column: 1, offset: 0},
              end: {line: 2, column: 4, offset: 7}
            }
          }
        ],
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 2, column: 4, offset: 7}
        }
      }
    )
  })

  await t.test('should support alignment', async function () {
    assert.deepEqual(
      fromMarkdown('| a | b | c | d |\n| - | :- | -: | :-: |', {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()]
      }),
      {
        type: 'root',
        children: [
          {
            type: 'table',
            align: [null, 'left', 'right', 'center'],
            children: [
              {
                type: 'tableHead',
                children: [
                  {
                    type: 'tableRow',
                    children: [
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'text',
                            value: 'a',
                            position: {
                              start: {line: 1, column: 3, offset: 2},
                              end: {line: 1, column: 4, offset: 3}
                            }
                          }
                        ],
                        data: {hName: 'th'},
                        position: {
                          start: {line: 1, column: 1, offset: 0},
                          end: {line: 1, column: 5, offset: 4}
                        }
                      },
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'text',
                            value: 'b',
                            position: {
                              start: {line: 1, column: 7, offset: 6},
                              end: {line: 1, column: 8, offset: 7}
                            }
                          }
                        ],
                        data: {hName: 'th', hProperties: {align: 'left'}},
                        position: {
                          start: {line: 1, column: 5, offset: 4},
                          end: {line: 1, column: 9, offset: 8}
                        }
                      },
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'text',
                            value: 'c',
                            position: {
                              start: {line: 1, column: 11, offset: 10},
                              end: {line: 1, column: 12, offset: 11}
                            }
                          }
                        ],
                        data: {hName: 'th', hProperties: {align: 'right'}},
                        position: {
                          start: {line: 1, column: 9, offset: 8},
                          end: {line: 1, column: 13, offset: 12}
                        }
                      },
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'text',
                            value: 'd',
                            position: {
                              start: {line: 1, column: 15, offset: 14},
                              end: {line: 1, column: 16, offset: 15}
                            }
                          }
                        ],
                        data: {hName: 'th', hProperties: {align: 'center'}},
                        position: {
                          start: {line: 1, column: 13, offset: 12},
                          end: {line: 1, column: 18, offset: 17}
                        }
                      }
                    ],
                    data: {hName: 'tr'},
                    position: {
                      start: {line: 1, column: 1, offset: 0},
                      end: {line: 1, column: 18, offset: 17}
                    }
                  }
                ],
                data: {hName: 'thead'},
                position: {
                  start: {line: 1, column: 1, offset: 0},
                  end: {line: 2, column: 22, offset: 39}
                }
              }
            ],
            data: {hName: 'table'},
            position: {
              start: {line: 1, column: 1, offset: 0},
              end: {line: 2, column: 22, offset: 39}
            }
          }
        ],
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 2, column: 22, offset: 39}
        }
      }
    )
  })

  await t.test(
    'should support an escaped pipe in code in a table cell',
    async function () {
      const tree = fromMarkdown('| `\\|` |\n | --- |', {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'table',
            align: [null],
            children: [
              {
                type: 'tableHead',
                children: [
                  {
                    type: 'tableRow',
                    children: [
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'inlineCode',
                            value: '|'
                          }
                        ],
                        data: {hName: 'th'}
                      }
                    ],
                    data: {hName: 'tr'}
                  }
                ],
                data: {hName: 'thead'}
              }
            ],
            data: {hName: 'table'}
          }
        ]
      })
    }
  )

  await t.test('should support rowspan in a table cell', async function () {
    const tree = fromMarkdown(
      '|1|2|3|\n| -: | - | :- |\n|^|b|\n|^|c|\n|^^|d|',
      {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()]
      }
    )

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'table',
          align: ['right', null, 'left'],
          children: [
            {
              type: 'tableHead',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: '1'
                        }
                      ],
                      data: {hName: 'th', hProperties: {align: 'right'}}
                    },
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: '2'
                        }
                      ],
                      data: {hName: 'th'}
                    },
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: '3'
                        }
                      ],
                      data: {hName: 'th', hProperties: {align: 'left'}}
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'thead'}
            },
            {
              type: 'tableBody',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: '^'
                        }
                      ],
                      data: {
                        hName: 'td',
                        hProperties: {rowspan: 3, align: 'right'}
                      },
                      rowspan: 3
                    },
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: 'b'
                        }
                      ],
                      data: {hName: 'td'}
                    },
                    {
                      type: 'tableCell',
                      children: [],
                      data: {hProperties: {align: 'left'}}
                    }
                  ],
                  data: {hName: 'tr'}
                },
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: 'c'
                        }
                      ],
                      data: {hName: 'td'}
                    },
                    {
                      type: 'tableCell',
                      children: [],
                      data: {hProperties: {align: 'left'}}
                    }
                  ],
                  data: {hName: 'tr'}
                },
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: 'd'
                        }
                      ],
                      data: {hName: 'td'}
                    },
                    {
                      type: 'tableCell',
                      children: [],
                      data: {hProperties: {align: 'left'}}
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'tbody'}
            }
          ],
          data: {hName: 'table'}
        }
      ]
    })
  })

  await t.test('should support colspan in a table cell', async function () {
    const tree = fromMarkdown('|1||\n| -: | - |\n|> |b|\n|a||\n||>|', {
      extensions: [gfmTable()],
      mdastExtensions: [gfmTableFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'table',
          align: ['right', null],
          children: [
            {
              type: 'tableHead',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: '1'
                        }
                      ],
                      data: {
                        hName: 'th',
                        hProperties: {colspan: 2, align: 'right'}
                      },
                      colspan: 2
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'thead'}
            },
            {
              type: 'tableBody',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: 'b'
                        }
                      ],
                      data: {hName: 'td', hProperties: {colspan: 2}},
                      colspan: 2
                    }
                  ],
                  data: {hName: 'tr'}
                },
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: 'a'
                        }
                      ],
                      data: {
                        hName: 'td',
                        hProperties: {colspan: 2, align: 'right'}
                      },
                      colspan: 2
                    }
                  ],
                  data: {hName: 'tr'}
                },
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [],
                      data: {hName: 'td', hProperties: {align: 'right'}}
                    },
                    {
                      type: 'tableCell',
                      children: [
                        {
                          type: 'text',
                          value: '>'
                        }
                      ],
                      data: {hName: 'td'}
                    }
                  ],
                  data: {hName: 'tr'}
                }
              ],
              data: {hName: 'tbody'}
            }
          ],
          data: {hName: 'table'}
        }
      ]
    })
  })

  await t.test(
    'should not support an escaped pipe in code *not* in a table cell',
    async function () {
      const tree = fromMarkdown('`\\|`', {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'inlineCode',
                value: '\\|'
              }
            ]
          }
        ]
      })
    }
  )

  await t.test(
    'should not support an escaped escape in code in a table cell',
    async function () {
      const tree = fromMarkdown('| `\\\\|`\\\\` b |\n | --- | --- |', {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'table',
            align: [null, null],
            children: [
              {
                type: 'tableHead',
                children: [
                  {
                    type: 'tableRow',
                    children: [
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'text',
                            value: '`\\'
                          }
                        ],
                        data: {hName: 'th'}
                      },
                      {
                        type: 'tableCell',
                        children: [
                          {
                            type: 'inlineCode',
                            value: '\\\\'
                          },
                          {
                            type: 'text',
                            value: ' b'
                          }
                        ],
                        data: {hName: 'th'}
                      }
                    ],
                    data: {hName: 'tr'}
                  }
                ],
                data: {hName: 'thead'}
              }
            ],
            data: {hName: 'table'}
          }
        ]
      })
    }
  )
})

test('gfmTableToMarkdown', async function (t) {
  /** @type {Table} */
  const minitable = {
    type: 'table',
    align: [null, 'left', 'center', 'right'],
    children: [
      {
        type: 'tableHead',
        children: [
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'b'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'c'}]}
            ]
          }
        ]
      }
    ]
  }

  const minitableDefault = toMarkdown(minitable, {
    extensions: [gfmTableToMarkdown()]
  })

  await t.test('should serialize a table cell', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'tableCell',
          children: [
            {type: 'text', value: 'a '},
            {type: 'emphasis', children: [{type: 'text', value: 'b'}]},
            {type: 'text', value: ' c.'}
          ]
        },
        {extensions: [gfmTableToMarkdown()]}
      ),
      'a *b* c.\n'
    )
  })

  await t.test('should serialize a table row', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'tableRow',
          children: [
            {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
            {
              type: 'tableCell',
              children: [
                {type: 'text', value: 'b '},
                {type: 'emphasis', children: [{type: 'text', value: 'c'}]},
                {type: 'text', value: ' d.'}
              ]
            }
          ]
        },
        {extensions: [gfmTableToMarkdown()]}
      ),
      '| a | b *c* d. |\n'
    )
  })

  await t.test('should serialize a table', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'table',
          children: [
            {
              type: 'tableRow',
              children: [
                {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
                {
                  type: 'tableCell',
                  children: [
                    {type: 'text', value: 'b '},
                    {type: 'emphasis', children: [{type: 'text', value: 'c'}]},
                    {type: 'text', value: ' d.'}
                  ]
                }
              ]
            },
            {
              type: 'tableRow',
              children: [
                {type: 'tableCell', children: [{type: 'text', value: 'e'}]},
                {
                  type: 'tableCell',
                  children: [{type: 'inlineCode', value: 'f'}]
                }
              ]
            }
          ]
        },
        {extensions: [gfmTableToMarkdown()]}
      ),
      '| a | b *c* d. |\n| - | -------- |\n| e | `f`      |\n'
    )
  })

  await t.test('should align cells', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'table',
          align: [null, 'left', 'center', 'right'],
          children: [
            {
              type: 'tableRow',
              children: [
                {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
                {type: 'tableCell', children: [{type: 'text', value: 'b'}]},
                {type: 'tableCell', children: [{type: 'text', value: 'c'}]},
                {type: 'tableCell', children: [{type: 'text', value: 'd'}]}
              ]
            },
            {
              type: 'tableRow',
              children: [
                {type: 'tableCell', children: [{type: 'text', value: 'aaa'}]},
                {type: 'tableCell', children: [{type: 'text', value: 'bbb'}]},
                {type: 'tableCell', children: [{type: 'text', value: 'ccc'}]},
                {type: 'tableCell', children: [{type: 'text', value: 'ddd'}]}
              ]
            }
          ]
        },
        {extensions: [gfmTableToMarkdown()]}
      ),
      '| a   | b   |  c  |   d |\n| --- | :-- | :-: | --: |\n| aaa | bbb | ccc | ddd |\n'
    )
  })

  await t.test('should support `tableCellPadding: false`', async function () {
    assert.deepEqual(
      toMarkdown(minitable, {
        extensions: [gfmTableToMarkdown({tableCellPadding: false})]
      }),
      '|a|b | c |\n|-|:-|:-:|\n'
    )
  })

  await t.test(
    'should support `tableCellPadding: true` (default)',
    async function () {
      assert.deepEqual(
        toMarkdown(minitable, {
          extensions: [gfmTableToMarkdown({tableCellPadding: true})]
        }),
        minitableDefault
      )
    }
  )

  await t.test('should support `tablePipeAlign: false`', async function () {
    assert.deepEqual(
      toMarkdown(minitable, {
        extensions: [gfmTableToMarkdown({tablePipeAlign: false})]
      }),
      '| a | b | c |\n| - | :- | :-: |\n'
    )
  })

  await t.test(
    'should support `tablePipeAlign: true` (default)',
    async function () {
      assert.deepEqual(
        toMarkdown(minitable, {
          extensions: [gfmTableToMarkdown({tablePipeAlign: true})]
        }),
        minitableDefault
      )
    }
  )

  await t.test('should support `stringLength`', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'table',
          align: [],
          children: [
            {
              type: 'tableRow',
              children: [
                {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
                {type: 'tableCell', children: [{type: 'text', value: '古'}]},
                {type: 'tableCell', children: [{type: 'text', value: '🤔'}]}
              ]
            }
          ]
        },
        {extensions: [gfmTableToMarkdown({stringLength: stringWidth})]}
      ),
      '| a | 古 | 🤔 |\n| - | -- | -- |\n'
    )
  })

  await t.test(
    'should escape the leading pipe in what would start or continue a table',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'paragraph',
            children: [{type: 'text', value: '| a |\n| - |'}]
          },
          {extensions: [gfmTableToMarkdown()]}
        ),
        '\\| a |\n\\| - |\n'
      )
    }
  )

  await t.test(
    'should escape the leading dash in what could start a delimiter row (done by list dash)',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a|\n-|'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        'a|\n\\-|\n'
      )
    }
  )

  await t.test(
    'should escape the leading colon in what could start a delimiter row',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'a\n:-'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        'a\n\\:-\n'
      )
    }
  )

  await t.test(
    'should not escape a backslash in code in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\b'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        '`a\\b`\n'
      )
    }
  )

  await t.test(
    'should not escape an “escaped” backslash in code in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'tableCell',
            children: [{type: 'inlineCode', value: 'a\\\\b'}]
          },
          {extensions: [gfmTableToMarkdown()]}
        ),
        '`a\\\\b`\n'
      )
    }
  )

  await t.test(
    'should not escape an “escaped” other punctuation character in code in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\+b'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        '`a\\+b`\n'
      )
    }
  )

  await t.test(
    'should not escape a pipe character in code *not* in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'inlineCode', value: 'a|b'},
          {extensions: [gfmTableToMarkdown()]}
        ),
        '`a|b`\n'
      )
    }
  )

  await t.test(
    'should escape a pipe character in code in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        '`a\\|b`\n'
      )
    }
  )

  await t.test('should escape eols in a table cell', async function () {
    assert.deepEqual(
      toMarkdown(
        {type: 'tableCell', children: [{type: 'text', value: 'a\nb'}]},
        {extensions: [gfmTableToMarkdown()]}
      ),
      'a&#xA;b\n'
    )
  })

  await t.test(
    'should escape phrasing characters in table cells',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: '<a>'}]},
              {type: 'tableCell', children: [{type: 'text', value: '*a'}]},
              {type: 'tableCell', children: [{type: 'text', value: '![]()'}]}
            ]
          },
          {extensions: [gfmTableToMarkdown()]}
        ),
        '| \\<a> | \\*a | !\\[]\\() |\n'
      )
    }
  )

  await t.test('should escape pipes in a table cell', async function () {
    assert.deepEqual(
      toMarkdown(
        {type: 'tableCell', children: [{type: 'text', value: 'a|b'}]},
        {extensions: [gfmTableToMarkdown()]}
      ),
      'a\\|b\n'
    )
  })

  await t.test(
    'should escape multiple pipes in inline code in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b|c'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        '`a\\|b\\|c`\n'
      )
    }
  )

  await t.test(
    'should escape multiple pipes in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'tableCell', children: [{type: 'text', value: 'a|b|c'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        'a\\|b\\|c\n'
      )
    }
  )

  await t.test(
    'should escape adjacent pipes in a table cell',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'tableCell', children: [{type: 'inlineCode', value: 'a||b'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        '`a\\|\\|b`\n'
      )
      assert.deepEqual(
        toMarkdown(
          {type: 'tableCell', children: [{type: 'text', value: 'a||b'}]},
          {extensions: [gfmTableToMarkdown()]}
        ),
        'a\\|\\|b\n'
      )
    }
  )
})
