const isProduction = (process.env.NODE_ENV === 'production')

module.exports = plugin

function plugin({ types: t }) {
  const findBareSupers = {
    Super(path) {
      if (path.parentPath.isCallExpression({ callee: path.node })) {
        this.push(path.parentPath)
      }
    }
  }

  const buildClassMethod = (node) => {
    const { key, value  } = node

    let body

    if (value.body.type === 'BlockStatement') {
      body = value.body
    } else {
      body = t.blockStatement([t.returnStatement(value.body)])
    }

    const method = t.classMethod(
      'method',
      t.identifier(key.name),
      value.params,
      body
    )

    method.async = value.async

    return method
  }

  const buildBindStatement = (ref, { key, computed }) => {
    const member = t.memberExpression(ref, key, computed || t.isLiteral(key))

    const value = t.callExpression(
      t.memberExpression(member, t.identifier('bind')),
      [t.thisExpression()]
    )

    return t.expressionStatement(t.assignmentExpression('=', member, value))
  }

  const isBoundProperty = (path) => {
    return path.isClassProperty() &&
      path.node.value &&
      path.node.value.type === 'ArrowFunctionExpression'
  }

  return {
    inherits: require('babel-plugin-syntax-class-properties'),

    visitor: {
      Class(path, state) {
        if (isProduction && !state.opts.production) return

        const props = []
        const body = path.get('body')
        const isDerived = !!path.node.superClass

        let constructor

        for (const path of body.get('body')) {
          if (path.isClassMethod({ kind: 'constructor' })) {
            constructor = path
          } else if (isBoundProperty(path)) {
            props.push(path)
          }
        }

        if (!props.length) return

        const bindStatements = []

        for (const prop of props) {
          const node = prop.node

          const method = buildClassMethod(node)

          body.pushContainer('body', [method])

          bindStatements.push(buildBindStatement(t.thisExpression(), node))
        }

        for (const prop of props) {
          prop.remove()
        }

        if (!constructor) {
          const newConstructor = t.classMethod(
            'constructor',
            t.identifier('constructor'),
            [],
            t.blockStatement([])
          )

          if (isDerived) {
            newConstructor.params = [t.restElement(t.identifier('args'))]

            newConstructor.body.body.push(
              t.returnStatement(t.callExpression(
                t.super(),
                [t.spreadElement(t.identifier('args'))]
              ))
            )
          }

          [constructor] = body.unshiftContainer('body', newConstructor)
        }

        if (isDerived) {
          const bareSupers = []

          constructor.traverse(findBareSupers, bareSupers)

          for (const bareSuper of bareSupers) {
            bareSuper.insertAfter(bindStatements)
          }
        } else {
          constructor.get('body').unshiftContainer('body', bindStatements)
        }
      }
    }
  }
}
