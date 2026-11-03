/**
 * A readable name for any function in the syntax tree, for the report. A declared or named function has its own name; an
 * anonymous one is named after where it lives: the variable or property it is assigned to, or the call it is passed to
 * ("forEach callback").
 */

/**
 * The smallest view of a syntax tree node that naming needs: its type and the few fields read below. ESLint's nodes have far
 * more, and every one of them fits this shape.
 * @typedef {{ type: string, name?: string, id?: SyntaxNode | null, key?: SyntaxNode, left?: SyntaxNode,
 *   property?: SyntaxNode, callee?: SyntaxNode, parent?: SyntaxNode | null }} SyntaxNode
 */

/**
 * The function's name, as it should read in the report.
 *
 * @param {SyntaxNode} functionNode A FunctionDeclaration, FunctionExpression or ArrowFunctionExpression.
 * @returns {string} Its own name, or a name taken from where it lives, or "anonymous function".
 */
export function functionName(functionNode) {
  const ownName = identifierName(functionNode.id);
  if (ownName) return ownName;

  const parent = functionNode.parent;
  if (!parent) return "anonymous function";
  return nameFromParent(parent) ?? "anonymous function";
}

/**
 * The name an anonymous function takes from the node it sits in, or null when that node gives it none.
 *
 * @param {SyntaxNode} parent The node holding the function.
 * @returns {string | null}
 */
function nameFromParent(parent) {
  switch (parent.type) {
    case "VariableDeclarator":
      return identifierName(parent.id);
    case "Property":
    case "MethodDefinition":
    case "PropertyDefinition":
      return identifierName(parent.key);
    case "AssignmentExpression":
      return assignedName(parent);
    case "CallExpression":
      return callbackName(parent);
    default:
      return null;
  }
}

/**
 * The name a function assigned to something takes: the variable, or the property of `object.property = function …`.
 *
 * @param {SyntaxNode} assignment The AssignmentExpression.
 * @returns {string | null}
 */
function assignedName(assignment) {
  const target = assignment.left;
  const isProperty = target?.type === "MemberExpression";
  const nameNode = isProperty ? target.property : target;
  return identifierName(nameNode);
}

/**
 * The name of a function passed to a call: "<callee> callback", such as "forEach callback" or "setTimeout callback".
 *
 * @param {SyntaxNode} call The CallExpression it is passed to.
 * @returns {string | null}
 */
function callbackName(call) {
  const callee = call.callee;
  const isMethodCall = callee?.type === "MemberExpression";
  const calleeNameNode = isMethodCall ? callee.property : callee;
  const calleeName = identifierName(calleeNameNode);
  return calleeName ? `${calleeName} callback` : null;
}

/**
 * The name of an identifier node, or null for anything else (a computed key, a destructuring pattern, nothing at all).
 *
 * @param {SyntaxNode | null | undefined} node The node that may be an identifier.
 * @returns {string | null}
 */
function identifierName(node) {
  const isIdentifier = node?.type === "Identifier" || node?.type === "PrivateIdentifier";
  return isIdentifier && node.name ? node.name : null;
}
