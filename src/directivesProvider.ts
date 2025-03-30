import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class DirectivesProvider implements vscode.TreeDataProvider<DirectiveItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DirectiveItem | undefined | void> = new vscode.EventEmitter<DirectiveItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<DirectiveItem | undefined | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: DirectiveItem): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<DirectiveItem[]> {
        const directivesPath = path.join(__dirname, "../template/directives.json");
        if (!fs.existsSync(directivesPath)) {
            return Promise.resolve([]);
        }

        const rawData = fs.readFileSync(directivesPath, "utf-8");
        const directives = JSON.parse(rawData);
        return Promise.resolve(directives.map((d: any) => new DirectiveItem(d.name, d.code)));
    }
}

class DirectiveItem extends vscode.TreeItem {
    constructor(label: string, public readonly code: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.command = {
            command: "extension.insertDirective",
            title: "Insert Directive",
            arguments: [code]
        };
    }
}
