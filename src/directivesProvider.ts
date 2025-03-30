import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface Directive {
    name: string;
    code: string;
    replacePattern: string;
    description: string;
    parameters: string[];
}

export class DirectivesProvider implements vscode.TreeDataProvider<DirectiveItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DirectiveItem | undefined | void> = new vscode.EventEmitter<DirectiveItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<DirectiveItem | undefined | void> = this._onDidChangeTreeData.event;

    private configSettings: { generateHtmlOnSave: boolean, generatePdfOnSave: boolean, configDirectory: string } ;

    constructor(configSettings: { generateHtmlOnSave: boolean, generatePdfOnSave: boolean, configDirectory: string } ) {
        this.configSettings = configSettings;
    }


    private loadDirectives(): any[] {
        const workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const projectDirectivesPath = path.join(workDir, this.configSettings.configDirectory, '/directives.json');
        const extensionDirectivesPath = path.join(__dirname, '../template/directives.json');

        let directives: any[] = [];

        // Charger les directives de base
        if (fs.existsSync(extensionDirectivesPath)) {
            directives = JSON.parse(fs.readFileSync(extensionDirectivesPath, 'utf-8'));
        }

        // Charger et fusionner avec les directives du projet si elles existent
        if (fs.existsSync(projectDirectivesPath)) {
            try {
                const projectDirectives = JSON.parse(fs.readFileSync(projectDirectivesPath, 'utf-8')) as Directive[];
                directives = [
                    ...directives,
                    ...projectDirectives.filter((projDir: Directive) =>
                        !directives.some((baseDir: Directive) => baseDir.name === projDir.name)
                    )
                ];
            } catch (error) {
                vscode.window.showErrorMessage(`Error reading directives.json: ${error}`);
            }
        }

        return directives;
    }
    getTreeItem(element: DirectiveItem): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<DirectiveItem[]> {
        const directives = this.loadDirectives();
        return Promise.resolve(directives.map((d: any) => new DirectiveItem(d.name, d.code, d.replacePattern)));
    }
}

class DirectiveItem extends vscode.TreeItem {
    constructor(label: string, public readonly code: string, public readonly replacePattern: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.command = {
            command: "extension.insertDirective",
            title: "Insert Directive",
            arguments: [code,replacePattern]
        };
    }
}
