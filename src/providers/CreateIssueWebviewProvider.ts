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
    * {
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 0;
      margin: 0;
      line-height: 1.5;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--vscode-foreground);
    }

    .subtitle {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 24px;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 13px;
      color: var(--vscode-foreground);
    }

    label .required {
      color: var(--vscode-errorForeground);
      margin-left: 2px;
    }

    .field-description {
      display: block;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 6px;
      font-weight: normal;
    }

    input, textarea, select {
      width: 100%;
      padding: 8px 10px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      transition: border-color 0.15s ease, outline 0.15s ease;
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--vscode-input-placeholderForeground);
      opacity: 0.8;
    }

    input:focus, textarea:focus, select:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
      outline-offset: -1px;
    }

    input:disabled, textarea:disabled, select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    input.error, textarea.error, select.error {
      border-color: var(--vscode-inputValidation-errorBorder);
      background-color: var(--vscode-inputValidation-errorBackground);
    }

    textarea {
      min-height: 120px;
      resize: vertical;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      line-height: 1.6;
    }

    select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 16px;
      padding-right: 32px;
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.15s ease;
      min-width: 100px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.primary {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    button.primary:hover:not(:disabled) {
      background-color: var(--vscode-button-hoverBackground);
    }

    button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover:not(:disabled) {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .error-message {
      color: var(--vscode-errorForeground);
      font-size: 12px;
      margin-top: 6px;
      display: none;
      align-items: flex-start;
      gap: 6px;
      line-height: 1.4;
    }

    .error-message.visible {
      display: flex;
    }

    .error-message::before {
      content: "⚠";
      flex-shrink: 0;
    }

    .success-message {
      color: var(--vscode-notificationsInfoIcon-foreground);
      background-color: var(--vscode-inputValidation-infoBackground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
      padding: 12px;
      border-radius: 2px;
      margin-bottom: 20px;
      display: none;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .success-message.visible {
      display: flex;
    }

    .success-message::before {
      content: "✓";
      font-weight: bold;
      flex-shrink: 0;
    }

    .info-message {
      background-color: var(--vscode-inputValidation-infoBackground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
      color: var(--vscode-input-foreground);
      padding: 12px;
      border-radius: 2px;
      margin-bottom: 20px;
      font-size: 12px;
      line-height: 1.5;
    }

    .char-counter {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      text-align: right;
      margin-top: 4px;
    }

    .char-counter.warning {
      color: var(--vscode-editorWarning-foreground);
    }

    .char-counter.error {
      color: var(--vscode-errorForeground);
    }

    /* Responsive design for smaller screens */
    @media (max-width: 600px) {
      .container {
        padding: 16px;
      }

      h1 {
        font-size: 20px;
      }

      .button-group {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }

    /* Loading state */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.4);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-overlay.visible {
      display: flex;
    }

    .loading-spinner {
      color: var(--vscode-foreground);
      font-size: 14px;
      padding: 20px;
      background-color: var(--vscode-editor-background);
      border-radius: 4px;
      border: 1px solid var(--vscode-widget-border);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Create ${issueType}</h1>
    <div class="subtitle">Fill out the form below to create a new ${issueType.toLowerCase()} in Jira</div>

    <div class="success-message" id="successMessage"></div>

    <form id="createIssueForm">
      <div class="form-section">
        <div class="form-section-title">Basic Information</div>

        <div class="form-group">
          <label for="summary">
            Summary <span class="required">*</span>
            <span class="field-description">A brief, clear title for the issue</span>
          </label>
          <input
            type="text"
            id="summary"
            name="summary"
            required
            maxlength="255"
            placeholder="e.g., Login button doesn't work on mobile"
            autocomplete="off">
          <div class="char-counter" id="summaryCounter">0 / 255</div>
          <div class="error-message" id="summaryError"></div>
        </div>

        <div class="form-group">
          <label for="description">
            Description
            <span class="field-description">Detailed description of the issue (supports plain text)</span>
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Provide detailed information about the issue...&#10;&#10;Steps to reproduce:&#10;1. Go to...&#10;2. Click on...&#10;3. See error...&#10;&#10;Expected behavior:&#10;&#10;Actual behavior:"></textarea>
          <div class="error-message" id="descriptionError"></div>
        </div>
      </div>

      <div class="button-group">
        <button type="submit" class="primary" id="submitButton">Create ${issueType}</button>
        <button type="button" class="secondary" id="cancelButton">Cancel</button>
      </div>
    </form>
  </div>

  <div class="loading-overlay" id="loadingOverlay">
    <div class="loading-spinner">Creating ${issueType}...</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Character counter for summary
    const summaryInput = document.getElementById('summary');
    const summaryCounter = document.getElementById('summaryCounter');
    const submitButton = document.getElementById('submitButton');

    summaryInput.addEventListener('input', () => {
      const length = summaryInput.value.length;
      const maxLength = 255;
      summaryCounter.textContent = length + ' / ' + maxLength;

      if (length > maxLength * 0.9) {
        summaryCounter.classList.add('warning');
      } else {
        summaryCounter.classList.remove('warning');
      }

      if (length >= maxLength) {
        summaryCounter.classList.add('error');
      } else {
        summaryCounter.classList.remove('error');
      }
    });

    // Real-time validation
    summaryInput.addEventListener('blur', () => {
      validateSummary();
    });

    function validateSummary() {
      const summary = summaryInput.value.trim();
      const summaryError = document.getElementById('summaryError');

      if (!summary) {
        summaryError.textContent = 'Summary is required';
        summaryError.classList.add('visible');
        summaryInput.classList.add('error');
        return false;
      } else if (summary.length < 10) {
        summaryError.textContent = 'Summary should be at least 10 characters';
        summaryError.classList.add('visible');
        summaryInput.classList.add('error');
        return false;
      } else {
        summaryError.classList.remove('visible');
        summaryInput.classList.remove('error');
        return true;
      }
    }

    function validateForm() {
      let isValid = true;

      // Validate summary
      if (!validateSummary()) {
        isValid = false;
      }

      // Description is optional, but could validate length if needed
      const description = document.getElementById('description').value.trim();
      const descriptionError = document.getElementById('descriptionError');
      descriptionError.classList.remove('visible');
      document.getElementById('description').classList.remove('error');

      return isValid;
    }

    // Form submission
    document.getElementById('createIssueForm').addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const summary = summaryInput.value.trim();
      const description = document.getElementById('description').value.trim();

      // Disable form and show loading
      submitButton.disabled = true;
      document.getElementById('cancelButton').disabled = true;
      summaryInput.disabled = true;
      document.getElementById('description').disabled = true;
      document.getElementById('loadingOverlay').classList.add('visible');

      // Send data to extension
      vscode.postMessage({
        command: 'submit',
        data: {
          issueType: '${issueType}',
          summary: summary,
          description: description
        }
      });
    });

    // Cancel button
    document.getElementById('cancelButton').addEventListener('click', () => {
      vscode.postMessage({
        command: 'cancel'
      });
    });

    // Listen for messages from extension (e.g., validation errors from server)
    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case 'error':
          // Re-enable form on error
          submitButton.disabled = false;
          document.getElementById('cancelButton').disabled = false;
          summaryInput.disabled = false;
          document.getElementById('description').disabled = false;
          document.getElementById('loadingOverlay').classList.remove('visible');

          // Show error message
          if (message.field === 'summary') {
            document.getElementById('summaryError').textContent = message.message;
            document.getElementById('summaryError').classList.add('visible');
            summaryInput.classList.add('error');
          } else if (message.field === 'description') {
            document.getElementById('descriptionError').textContent = message.message;
            document.getElementById('descriptionError').classList.add('visible');
            document.getElementById('description').classList.add('error');
          }
          break;
      }
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
