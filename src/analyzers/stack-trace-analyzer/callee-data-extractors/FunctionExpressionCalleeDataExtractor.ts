import { injectable } from 'inversify';

import * as estraverse from 'estraverse';
import * as ESTree from 'estree';

import { ICalleeData } from '../../../interfaces/analyzers/stack-trace-analyzer/ICalleeData';

import { AbstractCalleeDataExtractor } from './AbstractCalleeDataExtractor';
import { NodeGuards } from '../../../node/NodeGuards';
import { NodeUtils } from '../../../node/NodeUtils';

@injectable()
export class FunctionExpressionCalleeDataExtractor extends AbstractCalleeDataExtractor {
    /**
     * @param {NodeGuards[]} blockScopeBody
     * @param {Identifier} callee
     * @returns {ICalleeData}
     */
    public extract (blockScopeBody: ESTree.Node[], callee: ESTree.Identifier): ICalleeData | null {
        let calleeBlockStatement: ESTree.BlockStatement | null = null;

        if (NodeGuards.isIdentifierNode(callee)) {
            calleeBlockStatement = this.getCalleeBlockStatement(
                NodeUtils.getBlockScopesOfNode(blockScopeBody[0])[0],
                callee.name
            );
        }

        if (NodeGuards.isFunctionExpressionNode(callee)) {
            calleeBlockStatement = callee.body;
        }

        if (!calleeBlockStatement) {
            return null;
        }

        return {
            callee: calleeBlockStatement,
            name: callee.name || null
        };
    }

    /**
     * @param {NodeGuards} targetNode
     * @param {string} name
     * @returns {BlockStatement}
     */
    private getCalleeBlockStatement (targetNode: ESTree.Node, name: string): ESTree.BlockStatement | null {
        let calleeBlockStatement: ESTree.BlockStatement | null = null;

        estraverse.traverse(targetNode, {
            enter: (node: ESTree.Node, parentNode: ESTree.Node): any => {
                if (
                    NodeGuards.isFunctionExpressionNode(node) &&
                    NodeGuards.isVariableDeclaratorNode(parentNode) &&
                    NodeGuards.isIdentifierNode(parentNode.id) &&
                    parentNode.id.name === name
                ) {
                    calleeBlockStatement = node.body;

                    return estraverse.VisitorOption.Break;
                }
            }
        });

        return calleeBlockStatement;
    }
}
