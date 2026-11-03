import { describe, expect, it } from "vitest";
import { functionName } from "../measure/functionNames.js";

/** An identifier node with the given name. */
const identifier = (/** @type {string} */ name) => ({ type: "Identifier", name });

/** @typedef {import("../measure/functionNames.js").SyntaxNode} SyntaxNode */

/** An anonymous arrow function sitting in the given parent node. */
const arrowIn = (/** @type {SyntaxNode} */ parent) => ({ type: "ArrowFunctionExpression", id: null, parent });

describe("functionName", () => {
  it("uses a function's own name", () => {
    expect(functionName({ type: "FunctionDeclaration", id: identifier("loadPlan") })).toBe("loadPlan");
  });

  it("names an anonymous function after the variable, property or method it is assigned to", () => {
    expect(functionName(arrowIn({ type: "VariableDeclarator", id: identifier("double") }))).toBe("double");
    expect(functionName(arrowIn({ type: "Property", key: identifier("onClick") }))).toBe("onClick");
    expect(functionName(arrowIn({ type: "MethodDefinition", key: identifier("label") }))).toBe("label");
  });

  it("names a function assigned to a property after the property", () => {
    const assignment = { type: "AssignmentExpression", left: { type: "MemberExpression", property: identifier("render") } };
    expect(functionName(arrowIn(assignment))).toBe("render");
  });

  it("names a callback after the function or method it is passed to", () => {
    const methodCall = { type: "CallExpression", callee: { type: "MemberExpression", property: identifier("forEach") } };
    const plainCall = { type: "CallExpression", callee: identifier("setTimeout") };
    expect(functionName(arrowIn(methodCall))).toBe("forEach callback");
    expect(functionName(arrowIn(plainCall))).toBe("setTimeout callback");
  });

  it("falls back to 'anonymous function' when nothing around it gives a name", () => {
    expect(functionName(arrowIn({ type: "ReturnStatement" }))).toBe("anonymous function");
    expect(functionName({ type: "ArrowFunctionExpression", id: null, parent: null })).toBe("anonymous function");
  });
});
