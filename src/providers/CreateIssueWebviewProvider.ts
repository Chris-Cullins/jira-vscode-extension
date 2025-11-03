import * as vscode from 'vscode';
import { JiraClient } from '../api/JiraClient';
import { DummyJiraClient } from '../api/DummyJiraClient';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Workflow types for ticket creation
 */
export type TicketWorkflow = 'bugAgainstFeature' | 'internalDefect' | 'story' | 'task' | 'subtask';

/**
 * Webview Provider for creating Jira issues
 *
 * Provides a reusable webview panel for ticket creation forms.
 * Supports different issue types (Bug, Story, Task, etc.) and workflows
 * (Bug Against Feature, Internal Defect, etc.), handling form submission,
 * validation, and communication with the Jira API.
 */
export class CreateIssueWebviewProvider {
  private panel?: vscode.WebviewPanel;

  /**
   * Creates a new CreateIssueWebviewProvider
   *
   * @param context - VS Code extension context
   * @param jiraClient - JiraClient or DummyJiraClient instance for API calls
   * @param configManager - ConfigManager instance for accessing configuration
   */
  constructor(
    private context: vscode.ExtensionContext,
    private jiraClient: JiraClient | DummyJiraClient,
    private configManager: ConfigManager
  ) {}

  /**
   * Show the webview panel for creating an issue
   *
   * If the panel already exists, it will be revealed.
   * Otherwise, a new panel will be created.
   *
   * @param workflow - The workflow type for ticket creation
   * @param issueType - The type of issue to create (e.g., 'Bug', 'Story', 'Task')
   */
  async show(workflow: TicketWorkflow, issueType: string = 'Bug'): Promise<void> {
    const title = this.getWorkflowTitle(workflow, issueType);

    if (this.panel) {
      // If panel already exists, reveal it
      this.panel.reveal(vscode.ViewColumn.One);
      // Update the content for the new workflow/issue type
      this.panel.title = title;
      this.panel.webview.html = await this.getHtmlContent(workflow, issueType);
    } else {
      // Create new webview panel
      this.panel = vscode.window.createWebviewPanel(
        'jiraCreateIssue',
        title,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: []
        }
      );

      // Set the HTML content
      this.panel.webview.html = await this.getHtmlContent(workflow, issueType);

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
   * Get the title for a specific workflow
   *
   * @param workflow - The workflow type
   * @param issueType - The issue type
   * @returns Title string for the panel
   */
  private getWorkflowTitle(workflow: TicketWorkflow, issueType: string): string {
    switch (workflow) {
      case 'bugAgainstFeature':
        return 'Create Bug Against Feature';
      case 'internalDefect':
        return 'Create Internal Defect';
      case 'story':
        return 'Create Story';
      case 'task':
        return 'Create Task';
      case 'subtask':
        return 'Create Subtask';
      default:
        return `Create ${issueType}`;
    }
  }

  /**
   * Generate HTML content for the webview
   *
   * @param workflow - The workflow type
   * @param issueType - The type of issue being created
   * @returns HTML string for the webview
   */
  private async getHtmlContent(workflow: TicketWorkflow, issueType: string): Promise<string> {
    // Get configuration values
    const projectKey = this.configManager.projectKey;
    const featureEpics = this.configManager.featureEpics;

    // Get current user info for pre-populating reporter
    let currentUser: any;
    try {
      currentUser = await this.jiraClient.getCurrentUser();
    } catch (error) {
      // If we can't get user info, that's okay - we'll just not pre-populate
      currentUser = null;
    }

    // Get title for the panel
    const title = this.getWorkflowTitle(workflow, issueType);

    // For dynamic issue types (story, task, subtask), fetch metadata and use dynamic forms
    if (workflow === 'story' || workflow === 'task' || workflow === 'subtask') {
      return this.getDynamicFormHtml(workflow, issueType, projectKey);
    }

    // For specific workflows (bugAgainstFeature, internalDefect), use hardcoded forms
    // Determine which fields to show based on workflow
    const showFeatureEpicField = workflow === 'bugAgainstFeature';
    const showPriorityField = true; // All workflows have priority for now

    // Generate feature epic options HTML
    const featureEpicOptions = featureEpics.map(epic =>
      `<option value="${epic}">${epic}</option>`
    ).join('\n');

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
    <h1>${title}</h1>
    <div class="subtitle">Fill out the form below to create a new ${issueType.toLowerCase()} in Jira</div>

    <div class="success-message" id="successMessage"></div>

    ${!projectKey ? `
    <div class="info-message">
      ⚠️ No default project is configured. Please configure the extension first using "Jira: Configure" command.
    </div>
    ` : ''}

    <form id="createIssueForm">
      <div class="form-section">
        <div class="form-section-title">Basic Information</div>

        ${showFeatureEpicField ? `
        <div class="form-group">
          <label for="featureEpic">
            Feature Epic <span class="required">*</span>
            <span class="field-description">Select the feature epic this bug is related to</span>
          </label>
          <select id="featureEpic" name="featureEpic" required ${featureEpics.length === 0 ? 'disabled' : ''}>
            <option value="">-- Select a feature epic --</option>
            ${featureEpicOptions}
          </select>
          ${featureEpics.length === 0 ? `
          <div class="error-message visible">
            No feature epics configured. Please add feature epic IDs in the extension settings.
          </div>
          ` : `
          <div class="error-message" id="featureEpicError"></div>
          `}
        </div>
        ` : ''}

        <div class="form-group">
          <label for="summary">
            Summary <span class="required">*</span>
            <span class="field-description">A brief, clear title for the ${issueType.toLowerCase()}</span>
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
            Description ${workflow === 'bugAgainstFeature' ? '<span class="required">*</span>' : ''}
            <span class="field-description">Detailed description of the ${issueType.toLowerCase()} (supports plain text)</span>
          </label>
          <textarea
            id="description"
            name="description"
            ${workflow === 'bugAgainstFeature' ? 'required' : ''}
            placeholder="Provide detailed information about the ${issueType.toLowerCase()}...&#10;&#10;Steps to reproduce:&#10;1. Go to...&#10;2. Click on...&#10;3. See error...&#10;&#10;Expected behavior:&#10;&#10;Actual behavior:"></textarea>
          <div class="error-message" id="descriptionError"></div>
        </div>

        ${showPriorityField ? `
        <div class="form-group">
          <label for="priority">
            Priority
            <span class="field-description">Priority level for this ${issueType.toLowerCase()}</span>
          </label>
          <select id="priority" name="priority">
            <option value="">-- Select priority (optional) --</option>
            <option value="Highest">Highest</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Lowest">Lowest</option>
          </select>
          <div class="error-message" id="priorityError"></div>
        </div>
        ` : ''}
      </div>

      <div class="button-group">
        <button type="submit" class="primary" id="submitButton" ${!projectKey || (showFeatureEpicField && featureEpics.length === 0) ? 'disabled' : ''}>Create ${issueType}</button>
        <button type="button" class="secondary" id="cancelButton">Cancel</button>
      </div>
    </form>
  </div>

  <div class="loading-overlay" id="loadingOverlay">
    <div class="loading-spinner">Creating ${issueType}...</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Store workflow type for validation
    const workflow = '${workflow}';
    const issueType = '${issueType}';

    // Get form elements
    const summaryInput = document.getElementById('summary');
    const summaryCounter = document.getElementById('summaryCounter');
    const descriptionInput = document.getElementById('description');
    const submitButton = document.getElementById('submitButton');
    const featureEpicSelect = document.getElementById('featureEpic');
    const prioritySelect = document.getElementById('priority');

    // Character counter for summary
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

    // Real-time validation on blur
    summaryInput.addEventListener('blur', () => {
      validateSummary();
      updateSubmitButton();
    });

    // Real-time validation on input (debounced)
    let summaryTimeout;
    summaryInput.addEventListener('input', () => {
      clearTimeout(summaryTimeout);
      summaryTimeout = setTimeout(() => {
        validateSummary();
        updateSubmitButton();
      }, 500);
    });

    if (featureEpicSelect) {
      featureEpicSelect.addEventListener('change', () => {
        validateFeatureEpic();
        updateSubmitButton();
      });
    }

    if (descriptionInput) {
      descriptionInput.addEventListener('blur', () => {
        validateDescription();
        updateSubmitButton();
      });

      let descriptionTimeout;
      descriptionInput.addEventListener('input', () => {
        clearTimeout(descriptionTimeout);
        descriptionTimeout = setTimeout(() => {
          validateDescription();
          updateSubmitButton();
        }, 500);
      });
    }

    if (prioritySelect) {
      prioritySelect.addEventListener('change', () => {
        validatePriority();
        updateSubmitButton();
      });
    }

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
      } else if (summary.length > 255) {
        summaryError.textContent = 'Summary exceeds maximum length of 255 characters';
        summaryError.classList.add('visible');
        summaryInput.classList.add('error');
        return false;
      } else {
        summaryError.classList.remove('visible');
        summaryInput.classList.remove('error');
        return true;
      }
    }

    function validateDescription() {
      const description = descriptionInput.value.trim();
      const descriptionError = document.getElementById('descriptionError');

      // Description is required for Bug Against Feature workflow
      if (workflow === 'bugAgainstFeature' && !description) {
        descriptionError.textContent = 'Description is required for bugs against features';
        descriptionError.classList.add('visible');
        descriptionInput.classList.add('error');
        return false;
      } else if (workflow === 'bugAgainstFeature' && description.length < 20) {
        descriptionError.textContent = 'Description should be at least 20 characters for bugs against features';
        descriptionError.classList.add('visible');
        descriptionInput.classList.add('error');
        return false;
      } else {
        descriptionError.classList.remove('visible');
        descriptionInput.classList.remove('error');
        return true;
      }
    }

    function validateFeatureEpic() {
      if (!featureEpicSelect) return true;

      const featureEpic = featureEpicSelect.value;
      const featureEpicError = document.getElementById('featureEpicError');

      if (workflow === 'bugAgainstFeature' && !featureEpic) {
        if (featureEpicError) {
          featureEpicError.textContent = 'Feature epic is required';
          featureEpicError.classList.add('visible');
        }
        featureEpicSelect.classList.add('error');
        return false;
      } else {
        if (featureEpicError) {
          featureEpicError.classList.remove('visible');
        }
        featureEpicSelect.classList.remove('error');
        return true;
      }
    }

    function validatePriority() {
      // Priority is optional, so always valid
      return true;
    }

    function validateForm() {
      let isValid = true;

      // Validate summary
      if (!validateSummary()) {
        isValid = false;
      }

      // Validate description
      if (!validateDescription()) {
        isValid = false;
      }

      // Validate feature epic for Bug Against Feature workflow
      if (workflow === 'bugAgainstFeature' && !validateFeatureEpic()) {
        isValid = false;
      }

      return isValid;
    }

    function updateSubmitButton() {
      const isFormValid = validateForm();
      submitButton.disabled = !isFormValid;
    }

    // Initial validation to set button state
    updateSubmitButton();

    // Form submission
    document.getElementById('createIssueForm').addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const summary = summaryInput.value.trim();
      const description = descriptionInput.value.trim();
      const priority = prioritySelect ? prioritySelect.value : '';
      const featureEpic = featureEpicSelect ? featureEpicSelect.value : '';

      // Disable form and show loading
      submitButton.disabled = true;
      document.getElementById('cancelButton').disabled = true;
      summaryInput.disabled = true;
      descriptionInput.disabled = true;
      if (featureEpicSelect) featureEpicSelect.disabled = true;
      if (prioritySelect) prioritySelect.disabled = true;
      document.getElementById('loadingOverlay').classList.add('visible');

      // Send data to extension
      vscode.postMessage({
        command: 'submit',
        data: {
          workflow: workflow,
          issueType: issueType,
          summary: summary,
          description: description,
          priority: priority,
          featureEpic: featureEpic
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
          descriptionInput.disabled = false;
          if (featureEpicSelect) featureEpicSelect.disabled = false;
          if (prioritySelect) prioritySelect.disabled = false;
          document.getElementById('loadingOverlay').classList.remove('visible');

          // Show error message
          if (message.field === 'summary') {
            document.getElementById('summaryError').textContent = message.message;
            document.getElementById('summaryError').classList.add('visible');
            summaryInput.classList.add('error');
          } else if (message.field === 'description') {
            document.getElementById('descriptionError').textContent = message.message;
            document.getElementById('descriptionError').classList.add('visible');
            descriptionInput.classList.add('error');
          } else if (message.field === 'featureEpic' && featureEpicSelect) {
            const featureEpicError = document.getElementById('featureEpicError');
            if (featureEpicError) {
              featureEpicError.textContent = message.message;
              featureEpicError.classList.add('visible');
            }
            featureEpicSelect.classList.add('error');
          }
          break;
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Generate dynamic form HTML based on Jira create metadata
   *
   * @param workflow - The workflow type
   * @param issueType - The type of issue being created
   * @param projectKey - The project key
   * @returns HTML string for the dynamic webview form
   */
  private async getDynamicFormHtml(workflow: TicketWorkflow, issueType: string, projectKey: string): Promise<string> {
    const title = this.getWorkflowTitle(workflow, issueType);

    if (!projectKey) {
      return this.getErrorFormHtml(title, 'No default project configured. Please run "Jira: Configure" command.');
    }

    let metadata: any;
    try {
      metadata = await this.jiraClient.getCreateMetadata(projectKey, issueType);
    } catch (error) {
      return this.getErrorFormHtml(title, `Failed to fetch form metadata: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Extract fields from metadata
    const fields = metadata?.projects?.[0]?.issuetypes?.[0]?.fields || {};
    const fieldKeys = Object.keys(fields);

    // Filter out system fields that shouldn't be shown
    const excludedFields = ['project', 'issuetype', 'reporter', 'created', 'updated', 'attachment', 'issuelinks'];
    const displayFields = fieldKeys.filter(key => !excludedFields.includes(key));

    // Sort fields: required first, then optional
    displayFields.sort((a, b) => {
      const aRequired = fields[a].required ? 1 : 0;
      const bRequired = fields[b].required ? 1 : 0;
      return bRequired - aRequired;
    });

    // Generate form fields HTML
    const formFieldsHtml = displayFields.map(fieldKey => {
      const field = fields[fieldKey];
      return this.generateFieldHtml(fieldKey, field, workflow);
    }).join('\n');

    // Generate validation functions for JavaScript
    const validationFunctionsJs = this.generateValidationFunctions(displayFields, fields);

    // Serialize field metadata for the webview
    const fieldsMetadataJson = JSON.stringify(
      displayFields.reduce((acc, key) => {
        acc[key] = {
          name: fields[key].name,
          required: fields[key].required,
          schema: fields[key].schema
        };
        return acc;
      }, {} as Record<string, any>),
      null,
      2
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>${title}</title>
  ${this.getCommonStyles()}
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="subtitle">Fill out the form below to create a new ${issueType.toLowerCase()} in Jira</div>

    <div class="success-message" id="successMessage"></div>

    <form id="createIssueForm">
      <div class="form-section">
        <div class="form-section-title">Issue Details</div>
        ${formFieldsHtml}
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
    const workflow = '${workflow}';
    const issueType = '${issueType}';
    const fieldsMetadata = ${fieldsMetadataJson};

    // Form submission
    document.getElementById('createIssueForm').addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Collect form data
      const formData = {};
      Object.keys(fieldsMetadata).forEach(fieldKey => {
        const element = document.getElementById(fieldKey);
        if (element) {
          if (element.type === 'checkbox') {
            formData[fieldKey] = element.checked;
          } else if (element.multiple) {
            formData[fieldKey] = Array.from(element.selectedOptions).map(opt => opt.value);
          } else {
            formData[fieldKey] = element.value;
          }
        }
      });

      // Disable form and show loading
      document.getElementById('submitButton').disabled = true;
      document.getElementById('cancelButton').disabled = true;
      Object.keys(fieldsMetadata).forEach(fieldKey => {
        const element = document.getElementById(fieldKey);
        if (element) element.disabled = true;
      });
      document.getElementById('loadingOverlay').classList.add('visible');

      // Send data to extension
      vscode.postMessage({
        command: 'submit',
        data: {
          workflow: workflow,
          issueType: issueType,
          fields: formData
        }
      });
    });

    // Cancel button
    document.getElementById('cancelButton').addEventListener('click', () => {
      vscode.postMessage({
        command: 'cancel'
      });
    });

    ${validationFunctionsJs}

    // Listen for messages from extension (e.g., validation errors from server)
    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case 'error':
          // Re-enable form on error
          document.getElementById('submitButton').disabled = false;
          document.getElementById('cancelButton').disabled = false;
          Object.keys(fieldsMetadata).forEach(fieldKey => {
            const element = document.getElementById(fieldKey);
            if (element) element.disabled = false;
          });
          document.getElementById('loadingOverlay').classList.remove('visible');
          break;
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Generate HTML for a specific field based on its type
   */
  private generateFieldHtml(fieldKey: string, field: any, workflow: TicketWorkflow): string {
    const required = field.required ? '<span class="required">*</span>' : '';
    const requiredAttr = field.required ? 'required' : '';
    const fieldName = field.name;
    const schema = field.schema;

    // Handle different field types based on schema
    if (fieldKey === 'summary') {
      return `
        <div class="form-group">
          <label for="${fieldKey}">
            ${fieldName} ${required}
            <span class="field-description">A brief, clear title</span>
          </label>
          <input
            type="text"
            id="${fieldKey}"
            name="${fieldKey}"
            ${requiredAttr}
            maxlength="255"
            placeholder="Enter a summary..."
            autocomplete="off">
          <div class="char-counter" id="${fieldKey}Counter">0 / 255</div>
          <div class="error-message" id="${fieldKey}Error"></div>
        </div>
      `;
    }

    if (fieldKey === 'description') {
      return `
        <div class="form-group">
          <label for="${fieldKey}">
            ${fieldName} ${required}
            <span class="field-description">Detailed description (supports plain text)</span>
          </label>
          <textarea
            id="${fieldKey}"
            name="${fieldKey}"
            ${requiredAttr}
            placeholder="Provide detailed information..."></textarea>
          <div class="error-message" id="${fieldKey}Error"></div>
        </div>
      `;
    }

    // Handle select fields (priority, status, etc.)
    if (field.allowedValues && Array.isArray(field.allowedValues)) {
      const isMultiple = schema.type === 'array';
      const options = field.allowedValues.map((value: any) => {
        const optionValue = value.id || value.name || value.value || value;
        const optionLabel = value.name || value.value || value;
        return `<option value="${this.escapeHtml(optionValue)}">${this.escapeHtml(optionLabel)}</option>`;
      }).join('\n');

      return `
        <div class="form-group">
          <label for="${fieldKey}">
            ${fieldName} ${required}
          </label>
          <select
            id="${fieldKey}"
            name="${fieldKey}"
            ${requiredAttr}
            ${isMultiple ? 'multiple' : ''}>
            ${!field.required && !isMultiple ? '<option value="">-- Select an option --</option>' : ''}
            ${options}
          </select>
          <div class="error-message" id="${fieldKey}Error"></div>
        </div>
      `;
    }

    // Handle date fields
    if (schema.type === 'date' || schema.type === 'datetime') {
      return `
        <div class="form-group">
          <label for="${fieldKey}">
            ${fieldName} ${required}
          </label>
          <input
            type="${schema.type === 'datetime' ? 'datetime-local' : 'date'}"
            id="${fieldKey}"
            name="${fieldKey}"
            ${requiredAttr}>
          <div class="error-message" id="${fieldKey}Error"></div>
        </div>
      `;
    }

    // Handle user picker fields
    if (schema.type === 'user') {
      return `
        <div class="form-group">
          <label for="${fieldKey}">
            ${fieldName} ${required}
            <span class="field-description">Enter user email or username</span>
          </label>
          <input
            type="text"
            id="${fieldKey}"
            name="${fieldKey}"
            ${requiredAttr}
            placeholder="user@example.com">
          <div class="error-message" id="${fieldKey}Error"></div>
        </div>
      `;
    }

    // Handle number fields
    if (schema.type === 'number') {
      return `
        <div class="form-group">
          <label for="${fieldKey}">
            ${fieldName} ${required}
          </label>
          <input
            type="number"
            id="${fieldKey}"
            name="${fieldKey}"
            ${requiredAttr}
            step="any">
          <div class="error-message" id="${fieldKey}Error"></div>
        </div>
      `;
    }

    // Default: text input
    return `
      <div class="form-group">
        <label for="${fieldKey}">
          ${fieldName} ${required}
        </label>
        <input
          type="text"
          id="${fieldKey}"
          name="${fieldKey}"
          ${requiredAttr}
          placeholder="Enter ${fieldName.toLowerCase()}...">
        <div class="error-message" id="${fieldKey}Error"></div>
      </div>
    `;
  }

  /**
   * Generate validation functions for JavaScript
   */
  private generateValidationFunctions(fieldKeys: string[], fields: Record<string, any>): string {
    // Generate individual field validation functions
    const individualValidators = fieldKeys.map(key => {
      const field = fields[key];
      const schemaType = field.schema?.type;

      if (!field.required && schemaType !== 'string' && key !== 'summary') {
        return ''; // Skip validation for optional non-string fields
      }

      let validationLogic = '';

      if (field.required) {
        validationLogic += `
      if (!value || value.toString().trim() === '') {
        errorElement.textContent = '${field.name} is required';
        errorElement.classList.add('visible');
        fieldElement.classList.add('error');
        return false;
      }`;
      }

      // Add type-specific validation for summary
      if (key === 'summary') {
        validationLogic += `
      if (value.length < 10) {
        errorElement.textContent = 'Summary should be at least 10 characters';
        errorElement.classList.add('visible');
        fieldElement.classList.add('error');
        return false;
      }
      if (value.length > 255) {
        errorElement.textContent = 'Summary exceeds maximum length of 255 characters';
        errorElement.classList.add('visible');
        fieldElement.classList.add('error');
        return false;
      }`;
      }

      // Add type-specific validation for description
      if (key === 'description' && field.required) {
        validationLogic += `
      if (value.length < 20) {
        errorElement.textContent = 'Description should be at least 20 characters';
        errorElement.classList.add('visible');
        fieldElement.classList.add('error');
        return false;
      }`;
      }

      if (!validationLogic) {
        return '';
      }

      return `
    function validate_${key}() {
      const fieldElement = document.getElementById('${key}');
      const errorElement = document.getElementById('${key}Error');

      if (!fieldElement || !errorElement) return true;

      const value = fieldElement.value.trim();
      ${validationLogic}

      errorElement.classList.remove('visible');
      fieldElement.classList.remove('error');
      return true;
    }`;
    }).filter(v => v).join('\n');

    return `
    ${individualValidators}

    function validateForm() {
      let isValid = true;
      ${fieldKeys.map(key => {
        const field = fields[key];
        if (!field.required && key !== 'summary') return '';

        return `
      if (typeof validate_${key} === 'function' && !validate_${key}()) {
        isValid = false;
      }`;
      }).join('\n')}

      return isValid;
    }

    function updateSubmitButton() {
      const submitBtn = document.getElementById('submitButton');
      if (submitBtn) {
        submitBtn.disabled = !validateForm();
      }
    }

    // Add character counter for summary
    const summaryInput = document.getElementById('summary');
    const summaryCounter = document.getElementById('summaryCounter');
    if (summaryInput && summaryCounter) {
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
    }

    // Attach real-time validation to all required fields
    Object.keys(fieldsMetadata).forEach(fieldKey => {
      const field = fieldsMetadata[fieldKey];
      const element = document.getElementById(fieldKey);

      if (element && typeof window['validate_' + fieldKey] === 'function') {
        // Validation on blur
        element.addEventListener('blur', () => {
          window['validate_' + fieldKey]();
          updateSubmitButton();
        });

        // Debounced validation on input
        let timeout;
        element.addEventListener('input', () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            window['validate_' + fieldKey]();
            updateSubmitButton();
          }, 500);
        });
      }
    });

    // Initial button state
    updateSubmitButton();
    `;
  }

  /**
   * Generate error form HTML when metadata cannot be fetched
   */
  private getErrorFormHtml(title: string, errorMessage: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>${title}</title>
  ${this.getCommonStyles()}
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="info-message" style="border-color: var(--vscode-errorForeground); color: var(--vscode-errorForeground);">
      ⚠️ ${this.escapeHtml(errorMessage)}
    </div>
    <div class="button-group">
      <button type="button" class="secondary" id="closeButton">Close</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('closeButton').addEventListener('click', () => {
      vscode.postMessage({ command: 'cancel' });
    });
  </script>
</body>
</html>`;
  }

  /**
   * Get common CSS styles for all forms
   */
  private getCommonStyles(): string {
    return `<style>
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

    select[multiple] {
      min-height: 120px;
      background-image: none;
      padding-right: 10px;
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
  </style>`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (char) => div[char as keyof typeof div]);
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
      const projectKey = this.configManager.projectKey;

      if (!projectKey) {
        throw new Error('No default project configured. Please run "Jira: Configure" command.');
      }

      // Check if this is a dynamic form (has fields property) or old format
      const isDynamicForm = data.fields !== undefined;

      let createRequest: any;

      if (isDynamicForm) {
        // Build create issue request from dynamic fields
        createRequest = {
          projectKey: projectKey,
          issueType: data.issueType,
          summary: data.fields.summary || '',
          description: data.fields.description || ''
        };

        // Add all other fields as custom fields
        const customFields: Record<string, any> = {};
        Object.keys(data.fields).forEach(fieldKey => {
          if (fieldKey !== 'summary' && fieldKey !== 'description' && data.fields[fieldKey]) {
            const value = data.fields[fieldKey];
            // Skip empty values
            if (value !== '') {
              customFields[fieldKey] = value;
            }
          }
        });

        if (Object.keys(customFields).length > 0) {
          createRequest.customFields = customFields;
        }
      } else {
        // Old format for bugAgainstFeature and internalDefect workflows
        createRequest = {
          projectKey: projectKey,
          issueType: data.issueType,
          summary: data.summary,
          description: data.description
        };

        // Add priority if provided
        if (data.priority) {
          createRequest.priority = data.priority;
        }

        // For Bug Against Feature workflow, link to the feature epic
        if (data.workflow === 'bugAgainstFeature' && data.featureEpic) {
          const epicLinkFieldIds = ['customfield_10014', 'customfield_10008', 'customfield_10100'];
          createRequest.customFields = {
            [epicLinkFieldIds[0]]: data.featureEpic
          };
        }
      }

      // Create the issue
      const issue = await this.jiraClient.createIssue(createRequest);

      // Show success message
      const summaryText = isDynamicForm ? data.fields.summary : data.summary;
      const action = await vscode.window.showInformationMessage(
        `Created ${issue.key}: ${summaryText}`,
        'Open in Jira',
        'View in Tree'
      );

      if (action === 'Open in Jira') {
        const url = `${this.configManager.instanceUrl}/browse/${issue.key}`;
        await vscode.env.openExternal(vscode.Uri.parse(url));
      } else if (action === 'View in Tree') {
        // Trigger tree refresh via command
        await vscode.commands.executeCommand('jira.refresh');
      }

      // Close the panel on successful submission
      this.panel?.dispose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Parse field-specific errors from Jira API
      let fieldErrors: { field: string; message: string }[] = [];

      // Try to extract field-specific errors from Jira API error response
      if (error instanceof Error && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.errors) {
          // Jira returns errors in format: { "summary": "Summary is required", "description": "..." }
          Object.keys(response.data.errors).forEach(fieldKey => {
            fieldErrors.push({
              field: fieldKey,
              message: response.data.errors[fieldKey]
            });
          });
        }
      }

      // Check for common error patterns in error message
      if (fieldErrors.length === 0) {
        const lowerMessage = errorMessage.toLowerCase();
        if (lowerMessage.includes('summary')) {
          fieldErrors.push({ field: 'summary', message: errorMessage });
        } else if (lowerMessage.includes('description')) {
          fieldErrors.push({ field: 'description', message: errorMessage });
        } else if (lowerMessage.includes('epic') || lowerMessage.includes('feature')) {
          fieldErrors.push({ field: 'featureEpic', message: errorMessage });
        } else if (lowerMessage.includes('priority')) {
          fieldErrors.push({ field: 'priority', message: errorMessage });
        }
      }

      // Send field-specific errors back to webview
      if (this.panel && fieldErrors.length > 0) {
        fieldErrors.forEach(fieldError => {
          this.panel!.webview.postMessage({
            type: 'error',
            field: fieldError.field,
            message: fieldError.message
          });
        });

        // Also show a generic error notification
        vscode.window.showErrorMessage(
          `Failed to create ${data.issueType}: Please check the form for errors.`
        );
      } else {
        // Show generic error
        vscode.window.showErrorMessage(
          `Failed to create ${data.issueType}: ${errorMessage}`
        );

        // Re-enable form by closing loading overlay
        if (this.panel) {
          this.panel.webview.postMessage({
            type: 'error',
            field: 'general',
            message: errorMessage
          });
        }
      }
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
