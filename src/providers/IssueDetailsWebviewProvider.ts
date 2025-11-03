import * as vscode from 'vscode';
import { JiraClient } from '../api/JiraClient';
import { DummyJiraClient } from '../api/DummyJiraClient';
import { JiraIssueDetails } from '../models/jira';

/**
 * Webview Provider for displaying Jira issue details
 *
 * Shows a read-only view of issue information including:
 * - Summary, description, status, priority
 * - Comments, attachments
 * - Issue history and metadata
 */
export class IssueDetailsWebviewProvider {
  private panel?: vscode.WebviewPanel;

  constructor(
    private context: vscode.ExtensionContext,
    private jiraClient: JiraClient | DummyJiraClient
  ) {}

  /**
   * Show issue details in a webview panel
   */
  async show(issueKey: string): Promise<void> {
    try {
      // Fetch issue details
      const issue = await this.jiraClient.getIssueDetails(issueKey);

      // Create or reveal webview panel
      if (this.panel) {
        this.panel.reveal(vscode.ViewColumn.One);
        this.panel.title = `${issueKey}: ${issue.fields.summary}`;
        this.panel.webview.html = this.getHtmlContent(issue);
      } else {
        this.panel = vscode.window.createWebviewPanel(
          'jiraIssueDetails',
          `${issueKey}: ${issue.fields.summary}`,
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );

        this.panel.webview.html = this.getHtmlContent(issue);

        // Handle panel disposal
        this.panel.onDidDispose(() => {
          this.panel = undefined;
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to load issue details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate HTML content for the webview
   */
  private getHtmlContent(issue: JiraIssueDetails): string {
    const { fields } = issue;

    // Format dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    // Render description as plain text
    const description = fields.description ? this.renderADF(fields.description) : 'No description';

    // Render comments
    const commentsHtml = fields.comment?.comments && fields.comment.comments.length > 0
      ? fields.comment.comments.map(comment => `
        <div class="comment">
          <div class="comment-header">
            <strong>${comment.author.displayName}</strong>
            <span class="comment-date">${formatDate(comment.created)}</span>
          </div>
          <div class="comment-body">${this.renderADF(comment.body)}</div>
        </div>
      `).join('')
      : '<p class="no-data">No comments</p>';

    // Get priority emoji
    const priorityEmoji = this.getPriorityEmoji(fields.priority?.name);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${issue.key}</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      line-height: 1.6;
    }

    .header {
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .issue-key {
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }

    .issue-title {
      font-size: 1.5em;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .metadata {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
    }

    .metadata-label {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
    }

    .metadata-value {
      font-weight: 500;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .description {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .comment {
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.9em;
    }

    .comment-date {
      color: var(--vscode-descriptionForeground);
    }

    .comment-body {
      white-space: pre-wrap;
      line-height: 1.5;
    }

    .no-data {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }

    .labels {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .label {
      display: inline-block;
      padding: 2px 8px;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border-radius: 3px;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="issue-key">${issue.key}</div>
    <h1 class="issue-title">${fields.summary}</h1>

    <div class="metadata">
      <div class="metadata-item">
        <div class="metadata-label">Status</div>
        <div class="metadata-value">
          <span class="status-badge">${fields.status.name}</span>
        </div>
      </div>

      <div class="metadata-item">
        <div class="metadata-label">Type</div>
        <div class="metadata-value">${fields.issuetype.name}</div>
      </div>

      ${fields.priority ? `
      <div class="metadata-item">
        <div class="metadata-label">Priority</div>
        <div class="metadata-value">${priorityEmoji} ${fields.priority.name}</div>
      </div>
      ` : ''}

      <div class="metadata-item">
        <div class="metadata-label">Assignee</div>
        <div class="metadata-value">${fields.assignee?.displayName || 'Unassigned'}</div>
      </div>

      <div class="metadata-item">
        <div class="metadata-label">Reporter</div>
        <div class="metadata-value">${fields.reporter.displayName}</div>
      </div>

      ${fields.sprint ? `
      <div class="metadata-item">
        <div class="metadata-label">Sprint</div>
        <div class="metadata-value">${fields.sprint.name}</div>
      </div>
      ` : ''}

      <div class="metadata-item">
        <div class="metadata-label">Created</div>
        <div class="metadata-value">${formatDate(fields.created)}</div>
      </div>

      <div class="metadata-item">
        <div class="metadata-label">Updated</div>
        <div class="metadata-value">${formatDate(fields.updated)}</div>
      </div>
    </div>

    ${fields.labels && fields.labels.length > 0 ? `
    <div class="metadata-item">
      <div class="metadata-label">Labels</div>
      <div class="labels">
        ${fields.labels.map(label => `<span class="label">${label}</span>`).join('')}
      </div>
    </div>
    ` : ''}
  </div>

  <div class="section">
    <h2 class="section-title">Description</h2>
    <div class="description">${description}</div>
  </div>

  <div class="section">
    <h2 class="section-title">Comments (${fields.comment?.comments?.length || 0})</h2>
    ${commentsHtml}
  </div>
</body>
</html>`;
  }

  /**
   * Render ADF (Atlassian Document Format) to plain text
   */
  private renderADF(adf: any): string {
    if (!adf || !adf.content) {
      return '';
    }

    return adf.content
      .map((node: any) => {
        if (node.type === 'paragraph' && node.content) {
          return node.content.map((c: any) => c.text || '').join('');
        }
        return '';
      })
      .join('\n');
  }

  /**
   * Get priority emoji
   */
  private getPriorityEmoji(priority?: string): string {
    if (!priority) {
      return '';
    }

    switch (priority.toLowerCase()) {
      case 'highest':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      case 'lowest':
        return '⚪';
      default:
        return '';
    }
  }
}
