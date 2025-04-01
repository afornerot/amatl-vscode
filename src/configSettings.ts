import * as vscode from 'vscode';

export function getConfigSettings(): { 
    generateHtmlOnSave: boolean, 
    htmlDirectory: string, 
    generatePdfOnSave: boolean, 
    pdfDirectory: string, 
    configDirectory: string, 
    debugMode: boolean 
} {
    const config = vscode.workspace.getConfiguration('amatl');
    return {
        generateHtmlOnSave: config.get<boolean>('generateHtmlOnSave', true),
        htmlDirectory: config.get<string>('htmlDirectory', ''),
        generatePdfOnSave: config.get<boolean>('generatePdfOnSave', false),
        pdfDirectory: config.get<string>('pdfDirectory', ''),
        configDirectory: config.get<string>('configDirectory', ''),
        debugMode: config.get<boolean>('debugMode', false),
    };
}