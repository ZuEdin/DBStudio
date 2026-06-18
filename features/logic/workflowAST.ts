import { Workflow, WorkflowNode, WorkflowEdge } from '../../types/index';

export type ASTNode = {
    id: string;
    type: string;
    node: WorkflowNode;
    next: ASTNode[];
    trueBranch?: ASTNode[];
    falseBranch?: ASTNode[];
};

export const buildWorkflowAST = (workflow: Workflow): ASTNode[] | null => {
    // Topologische Sortierung und Baumstrukturierung
    const nodesMap = new Map<string, WorkflowNode>(workflow.nodes.map(n => [n.id, n]));
    
    // Finde den/die Trigger (Wurzeln)
    const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0) return null;

    const buildTree = (nodeId: string, visited: Set<string>): ASTNode[] => {
        if (visited.has(nodeId)) {
            console.warn('Zyklus im Workflow erkannt bei Node:', nodeId);
            return []; // Einfacher Schutz gegen Endlosschleifen
        }
        visited.add(nodeId);

        const node = nodesMap.get(nodeId);
        if (!node) return [];

        const outgoingEdges = workflow.edges.filter(e => e.sourceNodeId === nodeId);
        
        const astNode: ASTNode = {
            id: node.id,
            type: node.type,
            node: node,
            next: []
        };

        if (node.type === 'condition') {
            const trueEdge = outgoingEdges.find(e => e.label === 'True');
            const falseEdge = outgoingEdges.find(e => e.label === 'False');

            astNode.trueBranch = trueEdge ? buildTree(trueEdge.targetNodeId, new Set(visited)) : [];
            astNode.falseBranch = falseEdge ? buildTree(falseEdge.targetNodeId, new Set(visited)) : [];
        } else {
            for (const edge of outgoingEdges) {
                astNode.next.push(...buildTree(edge.targetNodeId, new Set(visited)));
            }
        }

        return [astNode];
    };

    const astRoots: ASTNode[] = [];
    for (const trigger of triggerNodes) {
        astRoots.push(...buildTree(trigger.id, new Set()));
    }

    return astRoots;
};

export const generateTypeScriptCode = (ast: ASTNode[]): string => {
    let code = "export const runWorkflow = async () => {\n";
    
    const visit = (nodes: ASTNode[], indentLevel: number) => {
        const indent = "    ".repeat(indentLevel);
        for (const astNode of nodes) {
            code += `${indent}// Node: ${astNode.node.label} (${astNode.type})\n`;
            
            if (astNode.type === 'trigger') {
                 code += `${indent}console.log("Workflow Started: ${astNode.node.label}");\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'condition') {
                 const op = astNode.node.conditionConfig?.operator || "===";
                 const val = astNode.node.conditionConfig?.value || "null";
                 code += `${indent}if (checkCondition("${op}", "${val}")) {\n`;
                 visit(astNode.trueBranch || [], indentLevel + 1);
                 code += `${indent}} else {\n`;
                 visit(astNode.falseBranch || [], indentLevel + 1);
                 code += `${indent}}\n`;
            } else if (astNode.type === 'action') {
                 const actionType = astNode.node.actionConfig?.actionType || "run";
                 code += `${indent}await executeAction("${actionType}");\n`;
                 visit(astNode.next, indentLevel);
            }
        }
    };
    
    visit(ast, 1);
    
    code += "};\n";
    return code;
};
export const generateCSharpCode = (ast: ASTNode[]): string => {
    let code = "public async Task RunWorkflowAsync() {\n";
    
    const visit = (nodes: ASTNode[], indentLevel: number) => {
        const indent = "    ".repeat(indentLevel);
        for (const astNode of nodes) {
            code += `${indent}// Node: ${astNode.node.label} (${astNode.type})\n`;
            
            if (astNode.type === 'trigger') {
                 code += `${indent}Console.WriteLine("Workflow Started: ${astNode.node.label}");\n`;
                 visit(astNode.next, indentLevel);
            } else if (astNode.type === 'condition') {
                 // Simplified condition logic
                 const op = astNode.node.conditionConfig?.operator || "==";
                 const val = astNode.node.conditionConfig?.value || "null";
                 code += `${indent}if (CheckCondition("${op}", "${val}")) {\n`;
                 visit(astNode.trueBranch || [], indentLevel + 1);
                 code += `${indent}} else {\n`;
                 visit(astNode.falseBranch || [], indentLevel + 1);
                 code += `${indent}}\n`;
            } else if (astNode.type === 'action') {
                 const actionType = astNode.node.actionConfig?.actionType || "run";
                 code += `${indent}await ExecuteActionAsync("${actionType}");\n`;
                 visit(astNode.next, indentLevel);
            }
        }
    };
    
    visit(ast, 1);
    
    code += "}\n";
    return code;
};
