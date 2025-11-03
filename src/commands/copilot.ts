import * as vscode from 'vscode';
import { IssueItem } from '../providers/JiraTreeProvider';
import { JiraClient } from '../api/JiraClient';
import { DummyJiraClient } from '../api/DummyJiraClient';
import { AuthManager } from '../api/AuthManager';
import { CacheManager } from '../api/CacheManager';
import { ConfigManager } from '../config/ConfigManager';
import { generateContextMarkdown } from '../utils/markdownGenerator';
import { saveContextFile, getContextFileAge, getContextFilePath } from '../utils/contextFileStorage';

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
		async (item: IssueItem, forceRefresh: boolean = false) => {
			try {
				if (!item || !item.issue) {
					vscode.window.showErrorMessage('No issue selected for investigation.');
					return;
				}

				const issueKey = item.issue.key;

				// Delegate to shared investigation logic
				await investigateIssueByKey(
					issueKey,
					context,
					authManager,
					configManager,
					cacheManager,
					forceRefresh
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
 * Register the "Investigate Ticket" command for the command palette
 *
 * Feature 7.8: Command Palette Command
 *
 * This command allows users to investigate any Jira issue by entering its key
 * via the command palette. It validates the issue key format and then calls
 * the same investigation logic used by the context menu command.
 *
 * @param context - VS Code extension context
 * @param authManager - AuthManager instance for credentials
 * @param configManager - ConfigManager instance for settings
 * @param cacheManager - CacheManager instance for caching
 * @returns Disposable for the command
 */
export function registerInvestigateTicketCommand(
	context: vscode.ExtensionContext,
	authManager: AuthManager,
	configManager: ConfigManager,
	cacheManager: CacheManager
): vscode.Disposable {
	return vscode.commands.registerCommand(
		'jira.investigateTicket',
		async () => {
			try {
				// Show input box for issue key
				const issueKey = await vscode.window.showInputBox({
					prompt: 'Enter Jira issue key',
					placeHolder: 'PROJ-123',
					validateInput: (value) => {
						// Validate issue key format (PROJECT-NUMBER)
						if (!value || value.trim() === '') {
							return 'Issue key cannot be empty';
						}
						if (!/^[A-Z]+-\d+$/.test(value.trim())) {
							return 'Invalid issue key format. Expected format: PROJ-123';
						}
						return null;
					}
				});

				// User cancelled input
				if (!issueKey) {
					return;
				}

				// Call the investigation logic directly by key
				await investigateIssueByKey(
					issueKey.trim(),
					context,
					authManager,
					configManager,
					cacheManager
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
 * Investigate a Jira issue by its key
 *
 * This function implements the core investigation logic that can be called
 * from both the context menu (with IssueItem) and the command palette (with string key).
 *
 * @param issueKey - The Jira issue key to investigate
 * @param context - VS Code extension context
 * @param authManager - AuthManager instance for credentials
 * @param configManager - ConfigManager instance for settings
 * @param cacheManager - CacheManager instance for caching
 * @param forceRefresh - Force refresh cached data if true
 */
async function investigateIssueByKey(
	issueKey: string,
	context: vscode.ExtensionContext,
	authManager: AuthManager,
	configManager: ConfigManager,
	cacheManager: CacheManager,
	forceRefresh: boolean = false
): Promise<void> {
	// Feature 7.7 - Check cache before fetching
	if (!forceRefresh) {
		const fileAge = await getContextFileAge(issueKey, configManager.contextFileLocation);
		const cacheExpiryMs = configManager.contextFileCacheExpiry * 1000;

		if (fileAge !== null && fileAge < cacheExpiryMs) {
			// Use cached file
			const filePath = await getContextFilePath(issueKey, configManager.contextFileLocation);
			if (filePath) {
				await addToCopilotContext(filePath);

				// Show cache age in notification
				const ageMinutes = Math.floor(fileAge / 60000);
				const ageHours = Math.floor(ageMinutes / 60);
				let ageText: string;
				if (ageHours > 0) {
					ageText = `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
				} else if (ageMinutes > 0) {
					ageText = `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
				} else {
					ageText = 'just now';
				}

				const action = await vscode.window.showInformationMessage(
					`Using cached context for ${issueKey} (updated ${ageText})`,
					'Open in Jira',
					'Ask Copilot',
					'Force Refresh'
				);

				if (action === 'Open in Jira') {
					await vscode.commands.executeCommand('jira.openIssue', issueKey);
				} else if (action === 'Ask Copilot') {
					await vscode.commands.executeCommand('workbench.action.chat.open');
				} else if (action === 'Force Refresh') {
					// Recursively call with force refresh
					await investigateIssueByKey(
						issueKey,
						context,
						authManager,
						configManager,
						cacheManager,
						true
					);
				}
				return;
			}
		}
	}

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
		}
	);

	// Feature 7.6 - User Notifications with action buttons
	const action = await vscode.window.showInformationMessage(
		`${issueKey} context ready for Copilot`,
		'Open in Jira',
		'Ask Copilot'
	);

	// Handle user action
	if (action === 'Open in Jira') {
		await vscode.commands.executeCommand('jira.openIssue', issueKey);
	} else if (action === 'Ask Copilot') {
		await vscode.commands.executeCommand('workbench.action.chat.open');
	}
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
