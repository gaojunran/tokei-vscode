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
        
        

        // 监听来自 Webview 的消息
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'refresh': // 处理 refresh 信号
                    await this.refresh();
                    break;
            }
        });

        this.refresh();

        // 设置定时自动刷新（每分钟）
        setInterval(() => this.refresh(), 60000);
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
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
        );

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
            <link href="${styleUri}" rel="stylesheet">
            <title>Tokei Statistics</title>
        </head>
        <body>
            <div class="header">
               <button id="refresh-btn">
                <div class="svg-wrapper-1">
                    <div class="svg-wrapper">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        class="icon"
                    >
                        <path
                        d="M12.793 2.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L14.086 7H12.5C8.952 7 6 9.952 6 13.5S8.952 20 12.5 20s6.5-2.952 6.5-6.5a1 1 0 1 1 2 0c0 4.652-3.848 8.5-8.5 8.5S4 18.152 4 13.5S7.848 5 12.5 5h1.586l-1.293-1.293a1 1 0 0 1 0-1.414"
                        ></path>
                    </svg>
                    </div>
                </div>
                <span>Refresh</span>
              </button>
            </div>
            <div id="stats-container"></div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}