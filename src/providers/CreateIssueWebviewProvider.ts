import * as vscode from 'vscode';
import { JiraClient } from '../api/JiraClient';

/**
 * Webview Provider for creating Jira issues
 *
 * Provides a reusable webview panel for ticket creation forms.
 * Supports different issue types (Bug, Story, Task, etc.) and handles
 * form submission, validation, and communication with the Jira API.
 */
export class CreateIssueWebviewProvider {
  private panel?: vscode.WebviewPanel;

  /**
   * Creates a new CreateIssueWebviewProvider
   *
   * @param context - VS Code extension context
   * @param jiraClient - JiraClient instance for API calls
   */
  constructor(
    private context: vscode.ExtensionContext,
    private jiraClient: JiraClient
  ) {}

  /**
   * Show the webview panel for creating an issue
   *
   * If the panel already exists, it will be revealed.
   * Otherwise, a new panel will be created.
   *
   * @param issueType - The type of issue to create (e.g., 'Bug', 'Story', 'Task')
   */
  async show(issueType: string): Promise<void> {
    if (this.panel) {
      // If panel already exists, reveal it
      this.panel.reveal(vscode.ViewColumn.One);
      // Update the content for the new issue type
      this.panel.title = `Create ${issueType}`;
      this.panel.webview.html = this.getHtmlContent(issueType);
    } else {
      // Create new webview panel
      this.panel = vscode.window.createWebviewPanel(
        'jiraCreateIssue',
        `Create ${issueType}`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: []
        }
      );

      // Set the HTML content
      this.panel.webview.html = this.getHtmlContent(issueType);

      // Handle messages from the webview
      this.panel.webview.onDidReceiveMessage(
        this.handleMessage.bind(this),
        undefined,
        this.context.subscriptions
      );

      // Handle panel disposal
      this.panel.onDidDispose(
        () => {
          this.panel = undefined;
        },
        null,
        this.context.subscriptions
      );
    }
  }

  /**
   * Generate HTML content for the webview
   *
   * @param issueType - The type of issue being created
   * @returns HTML string for the webview
   */
  private getHtmlContent(issueType: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Create ${issueType}</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      color: var(--vscode-foreground);
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    label .required {
      color: var(--vscode-errorForeground);
    }

    input, textarea, select {
      width: 100%;
      padding: 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      box-sizing: border-box;
    }

    input:focus, textarea:focus, select:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 24px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
    }

    button.primary {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    button.primary:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .error-message {
      color: var(--vscode-errorForeground);
      font-size: 12px;
      margin-top: 4px;
      display: none;
    }

    .error-message.visible {
      display: block;
    }
  </style>
</head>
<body>
  <h1>Create ${issueType}</h1>

  <form id="createIssueForm">
    <div class="form-group">
      <label for="summary">Summary <span class="required">*</span></label>
      <input type="text" id="summary" name="summary" required placeholder="Enter a brief summary...">
      <div class="error-message" id="summaryError"></div>
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea id="description" name="description" placeholder="Enter a detailed description..."></textarea>
      <div class="error-message" id="descriptionError"></div>
    </div>

    <div class="button-group">
      <button type="submit" class="primary">Create ${issueType}</button>
      <button type="button" class="secondary" id="cancelButton">Cancel</button>
    </div>
  </form>

  <script>
    const vscode = acquireVsCodeApi();

    // Form submission
    document.getElementById('createIssueForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const summary = document.getElementById('summary').value.trim();
      const description = document.getElementById('description').value.trim();

      // Basic validation
      let isValid = true;

      if (!summary) {
        document.getElementById('summaryError').textContent = 'Summary is required';
        document.getElementById('summaryError').classList.add('visible');
        isValid = false;
      } else {
        document.getElementById('summaryError').classList.remove('visible');
      }

      if (isValid) {
        // Send data to extension
        vscode.postMessage({
          command: 'submit',
          data: {
            issueType: '${issueType}',
            summary: summary,
            description: description
          }
        });
      }
    });

    // Cancel button
    document.getElementById('cancelButton').addEventListener('click', () => {
      vscode.postMessage({
        command: 'cancel'
      });
    });
  </script>
</body>
</html>`;
  }

  /**
   * Handle messages received from the webview
   *
   * @param message - Message object from the webview
   */
  private async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case 'submit':
        await this.createIssue(message.data);
        break;
      case 'cancel':
        this.panel?.dispose();
        break;
    }
  }

  /**
   * Create a new Jira issue
   *
   * @param data - Form data from the webview
   */
  private async createIssue(data: any): Promise<void> {
    try {
      // TODO: This will be implemented in Feature 6.7 (Form Submission Logic)
      // For now, just show a placeholder message
      vscode.window.showInformationMessage(
        `Issue creation will be implemented in Feature 6.7. Data received: ${data.summary}`
      );

      // Close the panel on successful submission
      this.panel?.dispose();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create ${data.issueType}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Dispose the webview panel
   */
  public dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
  }
}
