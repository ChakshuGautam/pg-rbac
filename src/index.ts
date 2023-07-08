import fs from 'fs';
import { loadPolicy } from '@open-policy-agent/opa-wasm';
import { Parser } from 'node-sql-parser';

interface PolicyDefiniton {
  user: string;
  table: string;
  operation: string;
}

export class Policy {
  schema: object;
  policies: PolicyDefiniton[];
  policy: any | null;
  parser: Parser;

  constructor(schema: object) {
    this.schema = schema;
    this.policies = [];
    this.policy = null;
    this.parser = new Parser();
  }

  addPolicy(user: string, table: string, operation: string): void {
    this.policies.push({ user, table, operation });
  }

  generateRegoFile(outputFile: string): void {
    let rego = 'package play\n\n';

    for (let policy of this.policies) {
      rego += `allow { input.user == "${policy.user}" && input.table == "${policy.table}" && input.operation == "${policy.operation}" }\n`;
    }

    fs.writeFileSync(outputFile, rego);
  }

  async loadPolicy(policyFile: string): Promise<void> {
    this.policy = await loadPolicy(policyFile);
  }

  async evaluatePolicy(user: string, sql: string): Promise<boolean> {
    if (!this.policy) {
      throw new Error('Policy not loaded');
    }

    const ast = this.parser.astify(sql);
    const tables = this.getTablesFromAst(ast);

    for (let table of tables) {
      const input = {
        user,
        table,
        operation: ast,
      };

      const result = this.policy.evaluate(input);
      if (!result[0].result) {
        return false;
      }
    }

    return true;
  }

  private getTablesFromAst(astNode: any): string[] {
    if (astNode.type === 'binary_expr') {
      return [
        ...this.getTablesFromAst(astNode.left),
        ...this.getTablesFromAst(astNode.right),
      ];
    }

    if (astNode.type === 'column_ref') {
      return [astNode.table];
    }

    return [];
  }
}
