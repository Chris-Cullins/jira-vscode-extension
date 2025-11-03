import * as vscode from 'vscode';
import { JiraClient } from '../api/JiraClient';
import { AuthManager } from '../api/AuthManager';
import { CacheManager } from '../api/CacheManager';

/**
 * Interface for the update_status tool parameters
 */
export interface IUpdateStatusParameters {
    issueKey: string;
    status: string;
}

/**
 * Language Model Tool for updating the status of Jira issues.
 * This tool allows Copilot to transition issues between different statuses.
 */
export class UpdateStatusTool implements vscode.LanguageModelTool<IUpdateStatusParameters> {
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
        options: vscode.LanguageModelToolInvocationPrepareOptions<IUpdateStatusParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { issueKey, status } = options.input;

        return {
            invocationMessage: `Updating ${issueKey} status to "${status}"...`
        };
    }

    /**
     * Executes the tool to update an issue's status.
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IUpdateStatusParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { issueKey, status } = options.input;

        try {
            // Validate parameters
            if (!issueKey || !issueKey.trim()) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        'Error: issueKey is required and cannot be empty.'
                    )
                ]);
            }

            if (!status || !status.trim()) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        'Error: status is required and cannot be empty.'
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

            // Get available transitions for the issue
            const transitions = await this.jiraClient.getAvailableTransitions(issueKey);

            // Find the transition that matches the requested status (case-insensitive)
            const targetTransition = transitions.find(
                t => t.to.name.toLowerCase() === status.toLowerCase()
            );

            if (!targetTransition) {
                // Provide helpful error with available transitions
                const availableStatuses = transitions.map(t => t.to.name).join(', ');
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        `Error: Cannot transition ${issueKey} to "${status}". Available statuses: ${availableStatuses}`
                    )
                ]);
            }

            // Execute the transition
            await this.jiraClient.transitionIssue(issueKey, targetTransition.id);

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Successfully updated ${issueKey} status to "${targetTransition.to.name}".`
                )
            ]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Error updating status for ${issueKey}: ${errorMessage}`
                )
            ]);
        }
    }
}
