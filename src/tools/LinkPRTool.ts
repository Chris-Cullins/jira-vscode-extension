import * as vscode from 'vscode';
import { JiraClient } from '../api/JiraClient';
import { AuthManager } from '../api/AuthManager';
import { CacheManager } from '../api/CacheManager';

/**
 * Interface for the link_pr tool parameters
 */
export interface ILinkPRParameters {
    issueKey: string;
    prUrl: string;
    title?: string;
}

/**
 * Language Model Tool for linking GitHub Pull Requests to Jira issues.
 * This tool allows Copilot to create remote links between issues and PRs.
 */
export class LinkPRTool implements vscode.LanguageModelTool<ILinkPRParameters> {
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
        options: vscode.LanguageModelToolInvocationPrepareOptions<ILinkPRParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { issueKey, prUrl } = options.input;

        return {
            invocationMessage: `Linking PR to ${issueKey}...`
        };
    }

    /**
     * Validates that a URL is a GitHub PR URL
     */
    private isValidGitHubPRUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            // Check if it's a GitHub URL and contains /pull/
            return urlObj.hostname === 'github.com' && url.includes('/pull/');
        } catch {
            return false;
        }
    }

    /**
     * Extracts a readable title from a GitHub PR URL
     */
    private extractPRTitle(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const prIndex = pathParts.indexOf('pull');

            if (prIndex !== -1 && prIndex + 1 < pathParts.length) {
                const prNumber = pathParts[prIndex + 1];
                const repo = pathParts.slice(1, prIndex).join('/');
                return `PR #${prNumber} - ${repo}`;
            }

            return url;
        } catch {
            return url;
        }
    }

    /**
     * Executes the tool to link a PR to a Jira issue.
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ILinkPRParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { issueKey, prUrl, title } = options.input;

        try {
            // Validate parameters
            if (!issueKey || !issueKey.trim()) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        'Error: issueKey is required and cannot be empty.'
                    )
                ]);
            }

            if (!prUrl || !prUrl.trim()) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        'Error: prUrl is required and cannot be empty.'
                    )
                ]);
            }

            // Validate URL format
            if (!this.isValidGitHubPRUrl(prUrl)) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        'Error: The provided URL does not appear to be a valid GitHub Pull Request URL. Expected format: https://github.com/owner/repo/pull/123'
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

            // Check if link already exists
            const existingLinks = await this.jiraClient.getRemoteLinks(issueKey);
            const linkExists = existingLinks.some(link =>
                link.object?.url === prUrl.trim()
            );

            if (linkExists) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        `The PR is already linked to ${issueKey}.`
                    )
                ]);
            }

            // Create the remote link
            const linkTitle = title?.trim() || this.extractPRTitle(prUrl);
            await this.jiraClient.createRemoteLink(issueKey, prUrl.trim(), linkTitle);

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Successfully linked PR to ${issueKey}.`
                )
            ]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Error linking PR to ${issueKey}: ${errorMessage}`
                )
            ]);
        }
    }
}
