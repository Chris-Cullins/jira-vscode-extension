import * as vscode from 'vscode';
import { IssueItem } from '../providers/JiraTreeProvider';
import { JiraClient } from '../api/JiraClient';
import { DummyJiraClient } from '../api/DummyJiraClient';
import { AuthManager } from '../api/AuthManager';
import { CacheManager } from '../api/CacheManager';
import { ConfigManager } from '../config/ConfigManager';
import { generateContextMarkdown } from '../utils/markdownGenerator';
import { saveContextFile } from '../utils/contextFileStorage';

/**
 * Register the "Investigate with Copilot" command
 *
 * This command allows users to investigate a Jira issue with GitHub Copilot
 * by fetching full issue details and generating a context file that Copilot
 * can use to provide better assistance.
 *
 * @param context - VS Code extension context
 * @param authManager - AuthManager instance for credentials
 * @param configManager - ConfigManager instance for settings
 * @param cacheManager - CacheManager instance for caching
 * @returns Disposable for the command
 */
export function registerInvestigateWithCopilotCommand(
	context: vscode.ExtensionContext,
	authManager: AuthManager,
	configManager: ConfigManager,
	cacheManager: CacheManager
): vscode.Disposable {
	return vscode.commands.registerCommand(
		'jira.investigateWithCopilot',
		async (item: IssueItem) => {
			try {
				if (!item || !item.issue) {
					vscode.window.showErrorMessage('No issue selected for investigation.');
					return;
				}

				const issueKey = item.issue.key;

				// Show progress notification
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: `Investigating ${issueKey} with Copilot...`,
						cancellable: false
					},
					async (progress) => {
						// Get Jira client (either real or dummy)
						progress.report({ message: 'Connecting to Jira...' });
						const jiraClient = await getJiraClient(authManager, configManager, cacheManager);
						if (!jiraClient) {
							vscode.window.showErrorMessage(
								'Unable to connect to Jira. Please run "Jira: Authenticate" to configure your credentials.'
							);
							return;
						}

						// Feature 7.2 - Fetch full issue details
						progress.report({ message: 'Fetching issue details...' });
						const issueContext = await jiraClient.getFullIssueContext(issueKey);

						// Feature 7.3 - Generate markdown file
						progress.report({ message: 'Generating context file...' });
						const markdown = generateContextMarkdown(
							issueContext,
							configManager.instanceUrl
						);

						// Feature 7.4 - Save context file
						progress.report({ message: 'Saving context file...' });
						const filePath = await saveContextFile(
							issueKey,
							markdown,
							configManager.contextFileLocation
						);

						// Feature 7.5 - Open file in editor for Copilot context
					progress.report({ message: 'Adding to Copilot context...' });
					await addToCopilotContext(filePath);

						// Show success message
						vscode.window.showInformationMessage(
							`Context file created for ${issueKey} at ${filePath}`
						);
					}
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to investigate issue: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}
	);
}

/**
 * Add a context file to Copilot's workspace context by opening it in the editor
 *
 * Feature 7.5: Copilot Context Integration
 *
 * Opening the file in the editor automatically adds it to Copilot's workspace context,
 * allowing Copilot to use the issue details when providing assistance.
 *
 * @param filePath - Absolute path to the context file
 */
async function addToCopilotContext(filePath: string): Promise<void> {
	// Open file in editor (adds to Copilot context)
	const doc = await vscode.workspace.openTextDocument(filePath);
	await vscode.window.showTextDocument(doc, {
		preview: false, // Not in preview mode - file stays open
		viewColumn: vscode.ViewColumn.Beside // Open in split view
	});

	// Optionally: Use Copilot API to explicitly add to context
	// (if such API exists in future)
}

/**
 * Get a JiraClient instance (either real or dummy)
 *
 * @param authManager - AuthManager instance for credentials
 * @param configManager - ConfigManager instance for settings
 * @param cacheManager - CacheManager instance for caching
 * @returns Promise that resolves to a JiraClient or DummyJiraClient, or null if not authenticated
 */
async function getJiraClient(
	authManager: AuthManager,
	configManager: ConfigManager,
	cacheManager: CacheManager
): Promise<JiraClient | DummyJiraClient | null> {
	try {
		// Check if dummy data mode is enabled
		if (configManager.useDummyData) {
			return new DummyJiraClient(undefined, undefined, undefined, cacheManager);
		}

		// Use real credentials for live API
		const credentials = await authManager.getCredentials();
		if (!credentials) {
			return null;
		}
		return new JiraClient(
			credentials.url,
			credentials.email,
			credentials.token,
			cacheManager
		);
	} catch (error) {
		return null;
	}
}
