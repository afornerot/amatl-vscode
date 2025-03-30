import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class FileCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[]> {
        const lineText = document.lineAt(position).text;
        const cursorPos = position.character;

        // Récupérer le texte avant le curseur
        const textBeforeCursor = lineText.substring(0, cursorPos);

        // Vérifier si on commence à taper un chemin (./ ou ../)
        const match = textBeforeCursor.match(/(\.\/|\.\.\/)([^\s]*)$/);
        if (match) {
            return this.getPathCompletions(document, match[0]);
        }

        return undefined;
    }

    private getPathCompletions(document: vscode.TextDocument, currentPath: string): vscode.CompletionItem[] | undefined {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return undefined;
        }

        const basePath = workspaceFolder.uri.fsPath;
        const fullPath = path.join(basePath, currentPath);

        if (!fs.existsSync(fullPath) || !fs.lstatSync(fullPath).isDirectory()) {
            return undefined;
        }

        const entries = fs.readdirSync(fullPath);
        return entries.map(entry => {
            const itemPath = path.join(fullPath, entry);
            const isDirectory = fs.lstatSync(itemPath).isDirectory();
            const completionItem = new vscode.CompletionItem(entry, isDirectory ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File);

            // Ajoute "/" si c'est un dossier pour continuer la complétion
            completionItem.insertText = entry + (isDirectory ? "/" : "");
            if (isDirectory) {
                completionItem.command = { title: "refreshCompletion", command: "extension.refreshCompletion", arguments: [currentPath + entry + "/"] };
            }

            return completionItem;
        });
    }
}
