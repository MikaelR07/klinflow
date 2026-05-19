import { Project, SyntaxKind, ParameterDeclaration } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "../apps/client/tsconfig.json",
});

const sourceFiles = project.getSourceFiles();

let fixedCount = 0;

for (const sourceFile of sourceFiles) {
  const params = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
  let fileChanged = false;

  for (const param of params) {
    // If it has an explicit type or initializer, skip
    if (param.getTypeNode() || param.getInitializer()) {
      continue;
    }
    
    // Check if TS would infer 'any' by seeing if it has implicit any
    // A simple heuristic: if it doesn't have a type node and its parent is an ArrowFunction or FunctionExpression
    // We can just explicitly type it as `any`? NO! The rule is: DO NOT introduce new `as any` or fake typing.
    // So we must figure out the type or use `any` if it's the only way? 
    // "DO NOT: introduce new `as any`" -> wait, does it mean NO `any` at all?
    // "replace unsafe data as Something[] patterns with inferred types"
  }
}
