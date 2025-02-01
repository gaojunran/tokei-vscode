// extension.ts
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { TokeiOutput } from './types';

export function activate(context: vscode.ExtensionContext) {
    const provider = new TokeiViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            TokeiViewProvider.viewType,
            provider
        )
    );

    // 注册手动刷新命令
    context.subscriptions.push(
        vscode.commands.registerCommand('tokei-stats.refresh', () => {
            provider.refresh();
        })
    );
}

class TokeiViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'tokei-sidebar.view';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        this.refresh();

        // 设置定时自动刷新（每5分钟）
        setInterval(() => this.refresh(), 300_000);
    }

    public async refresh() {
        if (!this._view) {
            return;
        }

        try {
            const stats = await this.getTokeiStats();
            this._view.webview.postMessage({
                type: 'update',
                data: stats
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Tokei统计失败: ${error}`);
        }
    }

    private async getTokeiStats(): Promise<TokeiOutput> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('未打开任何工作区');
        }

        return new Promise((resolve, reject) => {
            const cwd = workspaceFolders[0].uri.fsPath;
            const command = 'tokei --output json';

            exec(command, { cwd }, (error, stdout) => {
                if (error) {
                    return reject(error);
                }
                try {
                    resolve(JSON.parse(stdout));
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'src', 'media', 'main.js')
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'src', 'media', 'main.css')
        );

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Tokei Stats</title>
        </head>
        <body>
            <div class="header">
                <h1>代码统计</h1>
                <button id="refresh-btn">刷新</button>
            </div>
            <div id="stats-container"></div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}