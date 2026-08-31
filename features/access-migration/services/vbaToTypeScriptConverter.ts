export interface VbaConversionResult {
  typescriptCode: string;
  reactHookCode: string;
  detectedEvents: Array<{
    vbaName: string;
    tsHandlerName: string;
    eventType: 'onClick' | 'onChange' | 'onLoad' | 'onCurrent' | 'onBeforeUpdate' | 'onAfterUpdate' | 'customFunction';
    controlName?: string;
    description: string;
    linesOfCode: number;
  }>;
  statistics: {
    totalVbaLines: number;
    convertedFunctions: number;
    recognizedDocmdCalls: number;
    recognizedDomainAggregates: number; // DLookup, DCount, DSum
    recognizedUiAlerts: number;
  };
  warnings: string[];
}

/**
 * Access VBA to Modern TypeScript & React Transpiler
 * Transpiles MS Access VBA Form Event Procedures, DoCmd API, Domain Functions (DLookup/DCount),
 * and record mutations into type-safe async TypeScript handlers.
 */
export class VbaToTypeScriptConverter {
  public static transpile(vbaSource: string, formName: string = 'AccessForm'): VbaConversionResult {
    const rawLines = vbaSource.split(/\r?\n/);
    const cleanedLines = rawLines.map(l => l.trim());
    
    const detectedEvents: VbaConversionResult['detectedEvents'] = [];
    const warnings: string[] = [];
    let recognizedDocmdCalls = 0;
    let recognizedDomainAggregates = 0;
    let recognizedUiAlerts = 0;

    let inSubOrFunction = false;
    let currentBlockName = '';
    let currentBlockType: 'Sub' | 'Function' = 'Sub';
    let currentBlockLines: string[] = [];
    
    const transpiledFunctions: string[] = [];

    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      if (!line || line.startsWith("'") || line.startsWith("Rem ")) {
        continue;
      }

      // Check sub / function start
      const subMatch = line.match(/^(?:Private\s+|Public\s+|Friend\s+)?(?:Static\s+)?(Sub|Function)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(?:\s+As\s+([a-zA-Z0-9_]+))?/i);
      
      if (subMatch && !inSubOrFunction) {
        inSubOrFunction = true;
        currentBlockType = subMatch[1].toLowerCase() === 'function' ? 'Function' : 'Sub';
        currentBlockName = subMatch[2];
        currentBlockLines = [];
        continue;
      }

      // Check sub / function end
      if (inSubOrFunction && line.match(/^End\s+(Sub|Function)/i)) {
        inSubOrFunction = false;
        
        // Determine event type & control target
        let eventType: VbaConversionResult['detectedEvents'][0]['eventType'] = 'customFunction';
        let controlName: string | undefined = undefined;
        let tsHandlerName = currentBlockName;

        if (currentBlockName.toLowerCase() === 'form_current') {
          eventType = 'onCurrent';
          tsHandlerName = 'onFormCurrent';
        } else if (currentBlockName.toLowerCase() === 'form_load' || currentBlockName.toLowerCase() === 'form_open') {
          eventType = 'onLoad';
          tsHandlerName = 'onFormLoad';
        } else if (currentBlockName.toLowerCase().endsWith('_click')) {
          eventType = 'onClick';
          controlName = currentBlockName.slice(0, -6);
          tsHandlerName = `handle${controlName.charAt(0).toUpperCase() + controlName.slice(1)}Click`;
        } else if (currentBlockName.toLowerCase().endsWith('_change') || currentBlockName.toLowerCase().endsWith('_afterupdate')) {
          eventType = currentBlockName.toLowerCase().endsWith('_change') ? 'onChange' : 'onAfterUpdate';
          controlName = currentBlockName.replace(/_(change|afterupdate)$/i, '');
          tsHandlerName = `handle${controlName.charAt(0).toUpperCase() + controlName.slice(1)}Update`;
        }

        // Transpile body lines
        const transpiledBody = this.transpileBody(currentBlockLines, {
          onDocmd: () => recognizedDocmdCalls++,
          onDomain: () => recognizedDomainAggregates++,
          onAlert: () => recognizedUiAlerts++,
          addWarning: (w) => warnings.push(w)
        });

        detectedEvents.push({
          vbaName: currentBlockName,
          tsHandlerName,
          eventType,
          controlName,
          description: `Transpiliert von ${currentBlockType} ${currentBlockName}() (${currentBlockLines.length} Zeilen)`,
          linesOfCode: currentBlockLines.length
        });

        const funcDoc = `/**\n * Transpiled from Access VBA: ${currentBlockName}\n * Event Type: ${eventType}\n */`;
        const funcSignature = `export const ${tsHandlerName} = async (\n  record: Record<string, any>,\n  setRecord: React.Dispatch<React.SetStateAction<any>>,\n  ctx: FormContext\n): Promise<any> => {\n${transpiledBody}\n};`;
        
        transpiledFunctions.push(`${funcDoc}\n${funcSignature}`);
        continue;
      }

      if (inSubOrFunction) {
        currentBlockLines.push(line);
      }
    }

    // If no explicit Sub/Function wrapper was found, transpile the entire snippet as a standalone body
    if (transpiledFunctions.length === 0 && cleanedLines.length > 0) {
      const transpiledBody = this.transpileBody(cleanedLines, {
        onDocmd: () => recognizedDocmdCalls++,
        onDomain: () => recognizedDomainAggregates++,
        onAlert: () => recognizedUiAlerts++,
        addWarning: (w) => warnings.push(w)
      });
      
      detectedEvents.push({
        vbaName: 'CustomVbaSnippet',
        tsHandlerName: 'executeVbaAction',
        eventType: 'onClick',
        description: 'Transpiliertes VBA-Codefragment',
        linesOfCode: cleanedLines.length
      });

      transpiledFunctions.push(
        `/**\n * Transpiled from Access VBA Fragment\n */\nexport const executeVbaAction = async (\n  record: Record<string, any>,\n  setRecord: React.Dispatch<React.SetStateAction<any>>,\n  ctx: FormContext\n): Promise<any> => {\n${transpiledBody}\n};`
      );
    }

    const header = `import React from 'react';\nimport { FormContext } from '../types/formContext';\n\n`;
    const typescriptCode = header + transpiledFunctions.join('\n\n');

    // Generate clean React Hook Wrapper
    const reactHookCode = `import { useState, useCallback } from 'react';\nimport { useFormContext } from '../hooks/useFormContext';\nimport {\n${detectedEvents.map(e => `  ${e.tsHandlerName}`).join(',\n')}\n} from './${formName}Handlers';\n\nexport const use${formName}Events = (initialRecord: Record<string, any>) => {\n  const [record, setRecord] = useState(initialRecord);\n  const ctx = useFormContext();\n\n${detectedEvents.map(e => `  const ${e.tsHandlerName}Wrapped = useCallback(async () => {\n    return await ${e.tsHandlerName}(record, setRecord, ctx);\n  }, [record, ctx]);`).join('\n\n')}\n\n  return {\n    record,\n    setRecord,\n${detectedEvents.map(e => `    ${e.tsHandlerName}: ${e.tsHandlerName}Wrapped`).join(',\n')}\n  };\n};`;

    return {
      typescriptCode,
      reactHookCode,
      detectedEvents,
      statistics: {
        totalVbaLines: rawLines.length,
        convertedFunctions: detectedEvents.length,
        recognizedDocmdCalls,
        recognizedDomainAggregates,
        recognizedUiAlerts
      },
      warnings
    };
  }

  private static transpileBody(
    lines: string[],
    callbacks: {
      onDocmd: () => void;
      onDomain: () => void;
      onAlert: () => void;
      addWarning: (msg: string) => void;
    }
  ): string {
    const tsLines: string[] = [];
    let indent = '  ';

    for (const rawLine of lines) {
      let line = rawLine.trim();

      // Comment
      if (line.startsWith("'") || line.startsWith("Rem ")) {
        tsLines.push(`${indent}// ${line.replace(/^('|Rem\s+)/, '').trim()}`);
        continue;
      }

      // Exit Sub / Exit Function
      if (line.match(/^Exit\s+(Sub|Function)/i)) {
        tsLines.push(`${indent}return;`);
        continue;
      }

      // Dim declarations
      const dimMatch = line.match(/^Dim\s+([a-zA-Z0-9_,\s]+)(?:\s+As\s+([a-zA-Z0-9_]+))?/i);
      if (dimMatch) {
        const varName = dimMatch[1].trim();
        const vbaType = (dimMatch[2] || 'Variant').toLowerCase();
        let tsType = 'any';
        if (['string', 'char'].includes(vbaType)) tsType = 'string';
        else if (['integer', 'long', 'single', 'double', 'currency', 'byte'].includes(vbaType)) tsType = 'number';
        else if (vbaType === 'boolean') tsType = 'boolean';
        else if (vbaType === 'date') tsType = 'Date | string';
        
        tsLines.push(`${indent}let ${varName}: ${tsType};`);
        continue;
      }

      // MsgBox Transpilation
      const msgBoxMatch = line.match(/^MsgBox\s+(.+)/i) || line.match(/^(?:Call\s+)?MsgBox\((.+)\)/i);
      if (msgBoxMatch) {
        callbacks.onAlert();
        const args = msgBoxMatch[1].split(',');
        const prompt = this.cleanVbaExpression(args[0]?.trim() || '""');
        const title = args[2] ? this.cleanVbaExpression(args[2].trim()) : '"Meldung"';
        
        if (args[1] && args[1].toLowerCase().includes('vbyesno')) {
          tsLines.push(`${indent}const isConfirmed = await ctx.confirm(${prompt}, { title: ${title} });\n${indent}if (!isConfirmed) return;`);
        } else {
          tsLines.push(`${indent}ctx.toast.info(${prompt}, { title: ${title} });`);
        }
        continue;
      }

      // DoCmd API Transpilation
      if (line.toLowerCase().startsWith('docmd.')) {
        callbacks.onDocmd();
        const docmdBody = line.slice(6).trim();

        // DoCmd.OpenForm "FormName", ... , , "Criteria"
        const openFormMatch = docmdBody.match(/^OpenForm\s+["']?([^,"']+)["']?(?:,\s*[^,]*){0,3}(?:,\s*["']?([^"']*)["']?)?/i);
        if (openFormMatch) {
          const formTarget = openFormMatch[1];
          const filter = openFormMatch[2] ? `, { filter: ${this.cleanVbaExpression(openFormMatch[2])} }` : '';
          tsLines.push(`${indent}ctx.navigate('/forms/${formTarget}'${filter});`);
          continue;
        }

        // DoCmd.Close acForm, "FormName"
        const closeMatch = docmdBody.match(/^Close(?:\s+[a-zA-Z0-9_]+)?(?:,\s*["']?([^,"']+)["']?)?/i);
        if (closeMatch) {
          tsLines.push(`${indent}ctx.closeForm(${closeMatch[1] ? `"${closeMatch[1]}"` : 'undefined'});`);
          continue;
        }

        // DoCmd.RunSQL "SQL..."
        const runSqlMatch = docmdBody.match(/^RunSQL\s+(.+)/i);
        if (runSqlMatch) {
          tsLines.push(`${indent}await ctx.db.executeSql(${this.cleanVbaExpression(runSqlMatch[1])});`);
          continue;
        }

        // DoCmd.Requery
        if (docmdBody.match(/^Requery/i)) {
          tsLines.push(`${indent}await ctx.refreshData();`);
          continue;
        }

        // DoCmd.GoToRecord
        if (docmdBody.match(/^GoToRecord/i)) {
          tsLines.push(`${indent}ctx.navigateToRecord('next');`);
          continue;
        }
      }

      // Domain Aggregate Functions: DLookup, DCount, DSum, DAvg
      const domainMatch = line.match(/(DLookup|DCount|DSum|DAvg)\s*\(\s*["']?([^,"']+)["']?\s*,\s*["']?([^,"']+)["']?\s*(?:,\s*(.+?))?\s*\)/i);
      if (domainMatch) {
        callbacks.onDomain();
        const fn = domainMatch[1].toUpperCase();
        const expr = domainMatch[2];
        const domain = domainMatch[3];
        const criteria = domainMatch[4] ? this.cleanVbaExpression(domainMatch[4]) : '""';

        let call = '';
        if (fn === 'DLOOKUP') {
          call = `await ctx.db.table('${domain}').where(${criteria}).select('${expr}').first()`;
        } else if (fn === 'DCOUNT') {
          call = `await ctx.db.table('${domain}').where(${criteria}).count()`;
        } else if (fn === 'DSUM') {
          call = `await ctx.db.table('${domain}').where(${criteria}).sum('${expr}')`;
        } else {
          call = `await ctx.db.table('${domain}').where(${criteria}).avg('${expr}')`;
        }

        line = line.replace(domainMatch[0], `(${call})`);
      }

      // Record mutations: Me.FeldName = Wert
      const meAssignMatch = line.match(/^Me\.([a-zA-Z0-9_]+)\s*=\s*(.+)/i);
      if (meAssignMatch) {
        const field = meAssignMatch[1].toLowerCase();
        const valueExpr = this.cleanVbaExpression(meAssignMatch[2]);
        tsLines.push(`${indent}setRecord(prev => ({ ...prev, ${field}: ${valueExpr} }));`);
        continue;
      }

      // Standard variable assignment: var = value
      const varAssignMatch = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)/);
      if (varAssignMatch && !line.toLowerCase().startsWith('if ') && !line.toLowerCase().startsWith('while ')) {
        tsLines.push(`${indent}${varAssignMatch[1]} = ${this.cleanVbaExpression(varAssignMatch[2])};`);
        continue;
      }

      // If ... Then ...
      if (line.match(/^If\s+(.+)\s+Then$/i)) {
        const cond = this.cleanVbaExpression(line.replace(/^If\s+/i, '').replace(/\s+Then$/i, ''));
        tsLines.push(`${indent}if (${cond}) {`);
        indent += '  ';
        continue;
      }

      // ElseIf ... Then
      if (line.match(/^ElseIf\s+(.+)\s+Then$/i)) {
        const cond = this.cleanVbaExpression(line.replace(/^ElseIf\s+/i, '').replace(/\s+Then$/i, ''));
        const reducedIndent = indent.slice(2);
        tsLines.push(`${reducedIndent}} else if (${cond}) {`);
        continue;
      }

      // Else
      if (line.match(/^Else$/i)) {
        const reducedIndent = indent.slice(2);
        tsLines.push(`${reducedIndent}} else {`);
        continue;
      }

      // End If
      if (line.match(/^End\s+If$/i)) {
        indent = indent.slice(2);
        tsLines.push(`${indent}}`);
        continue;
      }

      // Transpile general expression fallback
      const cleaned = this.cleanVbaExpression(line);
      tsLines.push(`${indent}${cleaned};`);
    }

    return tsLines.join('\n');
  }

  private static cleanVbaExpression(vbaExpr: string): string {
    let expr = vbaExpr.trim();

    // Me.Field -> record.field
    expr = expr.replace(/Me\.([a-zA-Z0-9_]+)/g, (_, name) => `record.${name.toLowerCase()}`);
    expr = expr.replace(/\[([a-zA-Z0-9_\s]+)\]/g, (_, name) => `record.${name.trim().toLowerCase()}`);

    // VBA String concatenation: "a" & "b" -> "a" + "b"
    expr = expr.replace(/\s*&\s*/g, ' + ');

    // VBA Equality: = -> === (if not assignment)
    expr = expr.replace(/\bAnd\b/gi, '&&');
    expr = expr.replace(/\bOr\b/gi, '||');
    expr = expr.replace(/\bNot\b/gi, '!');
    expr = expr.replace(/\bTrue\b/gi, 'true');
    expr = expr.replace(/\bFalse\b/gi, 'false');
    expr = expr.replace(/\bNull\b/gi, 'null');

    // Nz(expr, default) -> (expr ?? default)
    expr = expr.replace(/Nz\s*\(([^,]+)(?:,\s*([^)]+))?\)/gi, (_, val, def) => `(${val.trim()} ?? ${def ? def.trim() : '""'})`);

    // IsNull(expr) -> (expr == null)
    expr = expr.replace(/IsNull\s*\(([^)]+)\)/gi, (_, val) => `(${val.trim()} == null)`);

    // UCase, LCase, Len
    expr = expr.replace(/UCase\s*\(([^)]+)\)/gi, (_, val) => `${val.trim()}.toUpperCase()`);
    expr = expr.replace(/LCase\s*\(([^)]+)\)/gi, (_, val) => `${val.trim()}.toLowerCase()`);
    expr = expr.replace(/Len\s*\(([^)]+)\)/gi, (_, val) => `${val.trim()}.length`);

    return expr;
  }
}
