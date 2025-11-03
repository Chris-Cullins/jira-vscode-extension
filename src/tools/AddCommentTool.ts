import * as vscode from 'vscode';
import { JiraClient } from '../api/JiraClient';
import { AuthManager } from '../api/AuthManager';
import { CacheManager } from '../api/CacheManager';

/**
 * Interface for the add_comment tool parameters
 */
export interface IAddCommentParameters {
    issueKey: string;
    comment: string;
}

/**
 * Language Model Tool for adding comments to Jira issues.
 * This tool allows Copilot to add comments to issues for documenting progress,
 * adding context, or responding to discussion.
 */
export class AddCommentTool implements vscode.LanguageModelTool<IAddCommentParameters> {
    private jiraClient: JiraClient | undefined;
    private authManager: AuthManager;
    private cacheManager: CacheManager;

    constructor(
        private context: vscode.ExtensionContext,
        authManager: AuthManager,
        cacheManager: CacheManager
    ) {
        this.authManager = authManager;
        this.cacheManager = cacheManager;
    }

    /**
     * Called when the tool is about to be invoked.
     * Provides a confirmation message to the user.
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IAddCommentParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { issueKey, comment } = options.input;

        return {
            invocationMessage: `Adding comment to ${issueKey}...`
        };
    }

    /**
     * Executes the tool to add a comment to a Jira issue.
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IAddCommentParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { issueKey, comment } = options.input;

        try {
            // Validate parameters
            if (!issueKey || !issueKey.trim()) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        'Error: issueKey is required and cannot be empty.'
                    )
                ]);
            }

            if (!comment || !comment.trim()) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        'Error: comment text is required and cannot be empty.'
                    )
                ]);
            }

            // Get or create Jira client
            if (!this.jiraClient) {
                const credentials = await this.authManager.getCredentials();
                if (!credentials) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(
                            'Jira credentials are not configured. Please run "Jira: Configure" command to set up authentication.'
                        )
                    ]);
                }

                this.jiraClient = new JiraClient(
                    credentials.url,
                    credentials.email,
                    credentials.token,
                    this.cacheManager
                );
            }

            // Add the comment
            const result = await this.jiraClient.addComment(issueKey, comment);

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Successfully added comment to ${issueKey}. Comment ID: ${result.id}`
                )
            ]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Error adding comment to ${issueKey}: ${errorMessage}`
                )
            ]);
        }
    }
}
