import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { DirectivesProvider } from "./directivesProvider";
import { FileCompletionProvider } from "./filePathCompletionProvider";
import { getConfigSettings } from './configSettings';

// 📌 Détecte l'OS et sélectionne le bon binaire
const platform = os.platform();
let AMATL_BINARY = "";

if (platform === "win32") {
    AMATL_BINARY = path.join(__dirname, "..", "bin", "amatl", "win", "amatl.exe");
} else if (platform === "darwin") {
    AMATL_BINARY = path.join(__dirname, "..", "bin", "amatl", "macos", "amatl");
} else {
    AMATL_BINARY = path.join(__dirname, "..", "bin", "amatl", "linux", "amatl");
}

process.env["PUPPETEER_EXECUTABLE_PATH"] = "/snap/bin/chromium";

// Fonction pour obtenir le chemin du fichier de configuration
function getConfigFile(configDirectory: string): string {
    let configFile: string;

    // Définition du fichier de configuration par défaut
    configFile = path.join(__dirname, '..', 'template', 'config.yml');

    // Si configDirectory est vide, on utilise le fichier par défaut

    if (configDirectory) {
        // Utilisation de workspaceFolders pour obtenir le répertoire de travail
        const workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

        // On contruit le path vers le fichier config.yml du workspace
        const potentialConfigFile = path.join(workDir, configDirectory, 'config.yml');
        if (fs.existsSync(potentialConfigFile)) {
            configFile = potentialConfigFile;
        }
    }

    return configFile;
}

// Fonction pour obtenir le chemin du fichier qui liste les fichiers à ne pas traiter
function getNoReplace(configDirectory: string): string | null {
    let noReplaceFile: string | null;

    // Définition du fichier de configuration par défaut
    noReplaceFile = path.join(__dirname, '..', 'template', 'noreplace.txt');
    if (!fs.existsSync(noReplaceFile)) {
        noReplaceFile = null;
    }

    // Si configDirectory est vide, on utilise le fichier par défaut

    if (configDirectory) {
        // Utilisation de workspaceFolders pour obtenir le répertoire de travail
        const workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

        // On contruit le path vers le fichier config.yml du workspace
        const potentialNoReplaceFile = path.join(workDir, configDirectory, 'noreplace.txt');
        if (fs.existsSync(potentialNoReplaceFile)) {
            noReplaceFile = potentialNoReplaceFile;
        }
    }

    return noReplaceFile;
}

// Fonction pour vérifier si basePath est dans le fichier noreplaceFile
function isFileInNoreplaceList(basePath: string, noreplaceFile: string): boolean {
    try {
        // Lire le fichier en tant que texte brut
        const fileContent = fs.readFileSync(noreplaceFile, 'utf-8');

        // Vérifier si basePath est présent dans le contenu du fichier
        return fileContent.split('\n').some(line => line.trim() === basePath);
    } catch (err) {
        if (err instanceof Error) {
            console.error(`❌ Erreur de lecture du fichier : ${err.message}`);
        }
        return false;
    }
}

// Export amatl
function renderAmatl(filePath: string, type: string) {
    // Générer html et pdf en fonction du paramétrage
    let settings = getConfigSettings();
    if ((type === "html" && !settings.generateHtmlOnSave) || (type === "pdf" && !settings.generatePdfOnSave)) {
        return;
    }

    // Ne pas traiter les fichiers présent dans noReplaceFile
    let noReplaceFile = getNoReplace(settings.configDirectory);
    let workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    if (noReplaceFile) {
        let basePath = filePath.replace(workDir + "/", "");
        if (isFileInNoreplaceList(basePath, noReplaceFile)) {
            return;
        }
    }

    // Placer les html/pdf dans un emplacement spécifique
    let outputFilePath = filePath.replace('.md', '.' + type);
    let configFile = getConfigFile(settings.configDirectory);

    if (type === "html" && settings.htmlDirectory) {
        outputFilePath = outputFilePath.replace(workDir, workDir + "/" + settings.htmlDirectory);
    }
    if (type === "pdf" && settings.pdfDirectory) {
        outputFilePath = outputFilePath.replace(workDir, workDir + "/" + settings.pdfDirectory);
    }
    const dirPath = path.dirname(outputFilePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Ajout du mode debug
    let debug = "";
    if (settings.debugMode) {
        debug = " --debug --log-level debug";
    }

    // Construction de la commande amatl
    let command = `${AMATL_BINARY} ${debug} render --config "${configFile}" ${type} -o "${outputFilePath}" "${filePath}"`;

    // Execution de la commande
    console.log(command);
    exec(command, { timeout: 1200000 }, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`❌ Erreur Amatl ${type}: ${error}`);
            console.log(`stderr = ${stderr}`);
            console.log(`stout = ${stdout}`);
            return;
        }

        vscode.window.showInformationMessage(`✅ ${type} généré avec succès : ${outputFilePath}`);
    });
}

// A
// Fonction principale
export function activate(context: vscode.ExtensionContext) {
    console.log("✅ [Amatl] Début de l'activation de l'extension.");

    // ✅ Vérifier si le binaire amatl existe
    if (!require('fs').existsSync(AMATL_BINARY)) {
        vscode.window.showErrorMessage("❌ Erreur : Binaire Amatl introuvable !");
    }

    // Action sur sauvegarde d'un fichier
    let disposable = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === "markdown") {
            const filePath = document.fileName;

            renderAmatl(filePath, "html");
            renderAmatl(filePath, "pdf");
        }
    });
    context.subscriptions.push(disposable);

    // Création d'un menu amatl-helper
    const directivesProvider = new DirectivesProvider();
    vscode.window.registerTreeDataProvider("amatlDirectives", directivesProvider);

    // Insertion de directives    
    context.subscriptions.push(
        vscode.commands.registerCommand("amatl.insertDirective", (directive, replacePattern) => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {

                const selection = editor.selection;
                const selectedText = editor.document.getText(selection);

                let finalSyntax = directive;

                // Remplace un placeholder replacePattern si présent dans la directive
                if (selectedText && replacePattern) {
                    finalSyntax = directive.replace(replacePattern, selectedText);
                }

                editor.edit((editBuilder) => {
                    if (selection.isEmpty) {
                        // Aucun texte sélectionné → insère simplement la directive au curseur
                        editBuilder.insert(selection.start, finalSyntax);
                    } else {
                        // Remplace la sélection par la directive formatée
                        editBuilder.replace(selection, finalSyntax);
                    }
                });

                // Remet le focus sur l'éditeur après l'insertion
                vscode.window.activeTextEditor?.show();
            }
        })
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: "file", language: "markdown" },
            new FileCompletionProvider(),
            ".", "/" // Déclenche la complétion sur `.` et `/`
        )
    );

    // Commande pour rafraîchir la complétion après sélection d'un dossier
    context.subscriptions.push(
        vscode.commands.registerCommand("amatl.refreshCompletion", async (newPath: string) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            };

            await vscode.commands.executeCommand("editor.action.triggerSuggest");
        })
    );

    // Commande pour générer le HTML
    let generateHtml = vscode.commands.registerCommand('amatl.generateHtml', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;

            // Vérifier si c'est un fichier Markdown
            if (document.languageId === "markdown") {
                const filePath = document.fileName;
                renderAmatl(filePath, "html");
            }
        }
    });

    // Commande pour générer le PDF
    let generatePdf = vscode.commands.registerCommand('amatl.generatePdf', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;

            // Vérifier si c'est un fichier Markdown
            if (document.languageId === "markdown") {
                const filePath = document.fileName;
                renderAmatl(filePath, "pdf");
            }
        }
    });

    context.subscriptions.push(generateHtml);
    context.subscriptions.push(generatePdf);

    console.log("✅ End activate");
}

export function deactivate() { }
