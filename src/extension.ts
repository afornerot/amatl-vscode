import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { DirectivesProvider } from "./directivesProvider";

// 📌 Détecte l'OS et sélectionne le bon binaire
const platform = os.platform();
let AMATL_BINARY = "";
let CHROMIUM_PATH = "";

if (platform === "win32") {
    AMATL_BINARY = path.join(__dirname, "..", "bin", "amatl", "win", "amatl.exe");
} else if (platform === "darwin") {
    AMATL_BINARY = path.join(__dirname, "..", "bin", "amatl", "macos", "amatl");
} else {
    AMATL_BINARY = path.join(__dirname, "..", "bin", "amatl", "linux", "amatl");
}

process.env["PUPPETEER_EXECUTABLE_PATH"] = "/snap/bin/chromium";

// Récupérer les settings de l'extension
function getConfigSettings(): { generateHtmlOnSave: boolean, generatePdfOnSave: boolean, configDirectory: string } {
    const config = vscode.workspace.getConfiguration('amatl');
    return {
        generateHtmlOnSave: config.get<boolean>('generateHtmlOnSave', true),
        generatePdfOnSave: config.get<boolean>('generatePdfOnSave', false),
        configDirectory: config.get<string>('configDirectory', '')
    };
}

// Fonction pour obtenir le chemin du fichier de configuration
function getConfigFile(configDirectory: string): string {
    let configFile: string;

    // Définition du fichier de configuration par défaut
    configFile = path.join(__dirname, '..', 'template', 'config.yml');

    // Si configDirectory est vide, on utilise le fichier par défaut
    
    if (configDirectory) {
        // Utilisation de workspaceFolders pour obtenir le répertoire de travail
        const workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        console.log(`workDir = ${workDir}`);
        // On contruit le path vers le fichier config.yml du workspace
        const potentialConfigFile = path.join(workDir, configDirectory, 'config.yml');
        console.log(`potentielConfigFile = ${potentialConfigFile}`);
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
        noReplaceFile=null;
    }

    // Si configDirectory est vide, on utilise le fichier par défaut
    
    if (configDirectory) {
        // Utilisation de workspaceFolders pour obtenir le répertoire de travail
        const workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        console.log(`workDir = ${workDir}`);
        // On contruit le path vers le fichier config.yml du workspace
        const potentialNoReplaceFile = path.join(workDir, configDirectory, 'noreplace.txt');
        console.log(`potentialNoReplaceFile = ${potentialNoReplaceFile}`);
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
function renderAmatl(filePath: string , type: string) {
    // Générer html et pdf en fonction du paramétrage
    let settings = getConfigSettings();
    if((type==="html"&&!settings.generateHtmlOnSave)||(type==="pdf"&&!settings.generatePdfOnSave)) {
        return;
    }

    // Ne pas traiter les fichiers présent dans noReplaceFile
    let noReplaceFile = getNoReplace(settings.configDirectory);
    if(noReplaceFile) {
        let workDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        let basePath=filePath.replace(workDir+"/","");
        if(isFileInNoreplaceList(basePath,noReplaceFile)) {
            return;
        }
    }

    let outputFilePath=filePath.replace('.md', '.'+type);
    let configFile=getConfigFile(settings.configDirectory);
    
    const command = `${AMATL_BINARY} render --config "${configFile}" ${type} -o "${outputFilePath}" "${filePath}" --pdf-exec-path ${CHROMIUM_PATH}`;
    console.log(command);
    exec(command, { timeout: 6000 }, (error, stdout, stderr) => {
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

    vscode.window.showInformationMessage("🔄 Vérification et installation d'Amatl...");

    // ✅ Vérifier si le binaire amatl existe
    if (!require('fs').existsSync(AMATL_BINARY)) {
        vscode.window.showErrorMessage("❌ Erreur : Binaire Amatl introuvable !");
    }

    // ✅ Vérifier que chromium est installé
    exec("which chromium", (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage("❌ Chromium non trouvé ! Vérifiez son installation.");
        } else {
            CHROMIUM_PATH=stdout.trim();
            vscode.window.showInformationMessage(`✅ Chromium trouvé : ${stdout.trim()}`);
        }
    });

    
    vscode.window.showInformationMessage("✅ Amatl prêt à l'utilisation !");

    // Action sur sauvegarde d'un fichier
    let disposable = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === "markdown") {
            const filePath = document.fileName;

            renderAmatl(filePath,"html");
            renderAmatl(filePath,"pdf");
        }
    });
    context.subscriptions.push(disposable);

    // Création d'un menu amatl-helper
    const directivesProvider = new DirectivesProvider(getConfigSettings());
    vscode.window.registerTreeDataProvider("amatlDirectives", directivesProvider);

    // Commande insertion de directives    
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.insertDirective", (directive,replacePattern) => {
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
}

export function deactivate() {}
