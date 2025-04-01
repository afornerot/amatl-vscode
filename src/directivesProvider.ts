import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getConfigSettings } from './configSettings';

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

    private configSettings;
    private directives: Directive[] = [];

    constructor() {
        this.configSettings = getConfigSettings();
        this.directives = this.loadDirectives();

        // Enregistrement de la commande de rafraîchissement
        vscode.commands.registerCommand("amatl.reloadDirectives", () => this.reload());
    }

    private loadDirectives(): Directive[] {
        const workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const projectDirectivesPath = path.join(workDir, this.configSettings.configDirectory, '/directives.json');
        const extensionDirectivesPath = path.join(__dirname, '../template/directives.json');

        let directives: Directive[] = [];

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
    
    public reload() {
        this.directives = this.loadDirectives(); // Recharge les directives depuis le fichier JSON
        this._onDidChangeTreeData.fire(); // Rafraîchit la vue
    }

    getTreeItem(element: DirectiveItem): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<DirectiveItem[]> {
        let items: DirectiveItem[] = [];

        // Ajoute un bouton de rafraîchissement en haut de la liste
        items.push(new DirectiveItem("Rafraîchir les directives", "", "", true));

        // Ajoute les directives en dessous
        items = items.concat(this.directives.map((d) => new DirectiveItem(d.name, d.code, d.replacePattern, false)));

        return Promise.resolve(items);
    }
}

class DirectiveItem extends vscode.TreeItem {
    constructor(label: string, public readonly code: string, public readonly replacePattern: string, isRefreshButton: boolean = false) {
        super(label, vscode.TreeItemCollapsibleState.None);

        if (isRefreshButton) {
            this.command = {
                command: "amatl.reloadDirectives",
                title: "Reload Directives",
            };
            this.iconPath = new vscode.ThemeIcon("refresh"); // Icône VS Code standard
        } else {
            this.command = {
                command: "amatl.insertDirective",
                title: "Insert Directive",
                arguments: [code, replacePattern]
            };
        }
    }
}
