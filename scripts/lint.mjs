import ts from 'typescript'
import path from 'node:path'
import { builtinModules } from 'node:module'

const root = process.cwd()
const configFile = ts.readConfigFile('tsconfig.check.json', ts.sys.readFile)
if (configFile.error)
  throw Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root, {
  incremental: false,
  noUnusedLocals: true,
  noUnusedParameters: true,
})
const program = ts.createProgram(config.fileNames, config.options)
const generated = (file) => /\/src\/(migrations\/|payload-types\.ts$)/.test(file)
const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter((diagnostic) => !diagnostic.file || !generated(diagnostic.file.fileName))
const host = {
  getCanonicalFileName: (file) => file,
  getCurrentDirectory: () => root,
  getNewLine: () => '\n',
}
if (diagnostics.length) console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host))

const nodeModules = new Set(builtinModules.map((name) => name.replace(/^node:/, '')))
const errors = new Set()
function checkClient(file, chain, visited) {
  if (visited.has(file.fileName)) return
  visited.add(file.fileName)
  function checkImport(specifier) {
    const name = specifier.text
    const resolved = ts.resolveModuleName(
      name,
      file.fileName,
      config.options,
      ts.sys,
    ).resolvedModule
    const target = resolved?.resolvedFileName
    const forbidden =
      name.startsWith('node:') ||
      name === 'server-only' ||
      nodeModules.has(name) ||
      /^(payload|pg|@payloadcms\/(db-[^/]+|email-[^/]+)|next\/(headers|cache|server))($|\/)/.test(
        name,
      ) ||
      (target && /\/src\/(server\/|collections\/|payload\.config\.ts$)/.test(target))
    if (forbidden) {
      errors.add(`${chain.join(' → ')} → ${name}: kode server tidak boleh diimpor oleh client`)
    } else if (target && !target.includes('/node_modules/')) {
      const dependency = program.getSourceFile(target)
      if (dependency) checkClient(dependency, [...chain, path.relative(root, target)], visited)
    }
  }
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause
      const bindings = clause?.namedBindings
      const onlyTypes =
        clause?.isTypeOnly ||
        (!clause?.name &&
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.length > 0 &&
          bindings.elements.every((element) => element.isTypeOnly))
      if (!onlyTypes && ts.isStringLiteral(node.moduleSpecifier)) checkImport(node.moduleSpecifier)
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly) {
      const onlyTypes =
        node.exportClause &&
        ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.length > 0 &&
        node.exportClause.elements.every((element) => element.isTypeOnly)
      if (!onlyTypes && ts.isStringLiteral(node.moduleSpecifier)) checkImport(node.moduleSpecifier)
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const specifier = node.arguments[0]
      if (specifier && ts.isStringLiteral(specifier)) checkImport(specifier)
      else
        errors.add(
          `${chain.join(' → ')}: import dinamis harus memakai path literal agar batas server dapat diperiksa`,
        )
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
}
for (const file of program.getSourceFiles()) {
  if (!file.fileName.startsWith(path.join(root, 'src')) || file.isDeclarationFile) continue
  if (
    file.statements.some(
      (statement) =>
        ts.isExpressionStatement(statement) &&
        ts.isStringLiteral(statement.expression) &&
        statement.expression.text === 'use client',
    )
  ) {
    checkClient(file, [path.relative(root, file.fileName)], new Set())
  }
}
for (const error of errors) console.error(error)
if (diagnostics.length || errors.size) process.exitCode = 1
else console.log('PASS: unused identifiers and transitive client/server imports.')
