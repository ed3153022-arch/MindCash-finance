const ts = require('typescript');
const fs = require('fs');
const file = 'src/app/(app)/investimentos/page.tsx';
const text = fs.readFileSync(file, 'utf8');
const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = ts.getPreEmitDiagnostics(sourceFile);
if (diagnostics.length === 0) {
  console.log('no diagnostics');
  process.exit(0);
}
for (const d of diagnostics) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  const message = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
  console.log(`${line + 1}:${character + 1} -> ${message}`);
}
