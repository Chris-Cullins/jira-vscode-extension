import {
  JiraIssue,
  JiraIssueDetails,
  JiraProject,
  JiraIssueType,
  JiraSprint,
  JiraUser,
  JiraStatus,
  JiraPriority,
  JiraTransition,
  JiraComment,
  CreateIssueResponse,
  JiraCreateMetadata
} from '../models/jira';

/**
 * Generates realistic dummy data for testing the extension UI without API access
 */
export class DummyDataGenerator {
  private static nextIssueId = 10000;
  private static nextCommentId = 1000;

  // Dummy users
  static readonly USERS: JiraUser[] = [
    {
      accountId: 'user1',
      emailAddress: 'john.doe@company.com',
      displayName: 'John Doe',
      active: true,
      avatarUrls: {
        '16x16': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '24x24': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '32x32': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '48x48': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png'
      }
    },
    {
      accountId: 'user2',
      emailAddress: 'jane.smith@company.com',
      displayName: 'Jane Smith',
      active: true,
      avatarUrls: {
        '16x16': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '24x24': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '32x32': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '48x48': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png'
      }
    },
    {
      accountId: 'user3',
      emailAddress: 'bob.johnson@company.com',
      displayName: 'Bob Johnson',
      active: true,
      avatarUrls: {
        '16x16': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '24x24': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '32x32': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png',
        '48x48': 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png'
      }
    }
  ];

  // Dummy projects
  static readonly PROJECTS: JiraProject[] = [
    {
      id: '10000',
      key: 'DEMO',
      name: 'Demo Project',
      projectTypeKey: 'software',
      avatarUrls: {
        '16x16': 'https://company.atlassian.net/secure/projectavatar?pid=10000',
        '24x24': 'https://company.atlassian.net/secure/projectavatar?pid=10000',
        '32x32': 'https://company.atlassian.net/secure/projectavatar?pid=10000',
        '48x48': 'https://company.atlassian.net/secure/projectavatar?pid=10000'
      }
    },
    {
      id: '10001',
      key: 'WEB',
      name: 'Web Application',
      projectTypeKey: 'software',
      avatarUrls: {
        '16x16': 'https://company.atlassian.net/secure/projectavatar?pid=10001',
        '24x24': 'https://company.atlassian.net/secure/projectavatar?pid=10001',
        '32x32': 'https://company.atlassian.net/secure/projectavatar?pid=10001',
        '48x48': 'https://company.atlassian.net/secure/projectavatar?pid=10001'
      }
    },
    {
      id: '10002',
      key: 'API',
      name: 'API Services',
      projectTypeKey: 'software',
      avatarUrls: {
        '16x16': 'https://company.atlassian.net/secure/projectavatar?pid=10002',
        '24x24': 'https://company.atlassian.net/secure/projectavatar?pid=10002',
        '32x32': 'https://company.atlassian.net/secure/projectavatar?pid=10002',
        '48x48': 'https://company.atlassian.net/secure/projectavatar?pid=10002'
      }
    }
  ];

  // Dummy issue types
  static readonly ISSUE_TYPES: JiraIssueType[] = [
    {
      id: '10001',
      name: 'Bug',
      description: 'A problem which impairs or prevents the functions of the product.',
      subtask: false,
      iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/bug.png'
    },
    {
      id: '10002',
      name: 'Story',
      description: 'A user story represents a requirement from a user perspective.',
      subtask: false,
      iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/story.png'
    },
    {
      id: '10003',
      name: 'Task',
      description: 'A task that needs to be done.',
      subtask: false,
      iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/task.png'
    },
    {
      id: '10004',
      name: 'Epic',
      description: 'A large user story that can be broken down into smaller stories.',
      subtask: false,
      iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/epic.png'
    },
    {
      id: '10005',
      name: 'Sub-task',
      description: 'A smaller piece of work that is part of a larger issue.',
      subtask: true,
      iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/subtask.png'
    }
  ];

  // Dummy sprints
  static readonly SPRINTS: JiraSprint[] = [
    {
      id: 1,
      name: 'Sprint 23',
      state: 'active',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      name: 'Sprint 24',
      state: 'future',
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      name: 'Sprint 22',
      state: 'closed',
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Dummy statuses
  static readonly STATUSES: JiraStatus[] = [
    {
      id: '10000',
      name: 'To Do',
      statusCategory: { id: 2, key: 'new', colorName: 'blue-gray', name: 'To Do' }
    },
    {
      id: '10001',
      name: 'In Progress',
      statusCategory: { id: 4, key: 'indeterminate', colorName: 'yellow', name: 'In Progress' }
    },
    {
      id: '10002',
      name: 'In Review',
      statusCategory: { id: 4, key: 'indeterminate', colorName: 'yellow', name: 'In Progress' }
    },
    {
      id: '10003',
      name: 'Done',
      statusCategory: { id: 3, key: 'done', colorName: 'green', name: 'Done' }
    },
    {
      id: '10004',
      name: 'Blocked',
      statusCategory: { id: 4, key: 'indeterminate', colorName: 'red', name: 'In Progress' }
    }
  ];

  // Dummy priorities
  static readonly PRIORITIES: JiraPriority[] = [
    {
      id: '1',
      name: 'Highest',
      iconUrl: 'https://company.atlassian.net/images/icons/priorities/highest.svg'
    },
    {
      id: '2',
      name: 'High',
      iconUrl: 'https://company.atlassian.net/images/icons/priorities/high.svg'
    },
    {
      id: '3',
      name: 'Medium',
      iconUrl: 'https://company.atlassian.net/images/icons/priorities/medium.svg'
    },
    {
      id: '4',
      name: 'Low',
      iconUrl: 'https://company.atlassian.net/images/icons/priorities/low.svg'
    },
    {
      id: '5',
      name: 'Lowest',
      iconUrl: 'https://company.atlassian.net/images/icons/priorities/lowest.svg'
    }
  ];

  // Dummy issues storage
  private static dummyIssues: JiraIssue[] = [];

  /**
   * Initialize dummy issues with realistic data
   */
  static initializeDummyIssues(): void {
    this.dummyIssues = [
      // TO DO issues
      {
        id: '10001',
        key: 'DEMO-101',
        self: 'https://company.atlassian.net/rest/api/2/issue/10001',
        fields: {
          summary: 'Fix login page styling issues on mobile devices',
          description: this.createADF('Users report that the login page appears broken on mobile devices. The form fields are not aligned properly and buttons are cut off.'),
          status: this.STATUSES[0], // To Do
          priority: this.PRIORITIES[1], // High
          issuetype: this.ISSUE_TYPES[0], // Bug
          project: this.PROJECTS[0],
          assignee: this.USERS[0],
          reporter: this.USERS[1],
          created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['ui', 'mobile', 'urgent'],
          sprint: this.SPRINTS[0]
        }
      },
      {
        id: '10002',
        key: 'WEB-234',
        self: 'https://company.atlassian.net/rest/api/2/issue/10002',
        fields: {
          summary: 'Implement dark mode for dashboard',
          description: this.createADF('Add a dark mode toggle to the dashboard. Should respect system preferences and remember user choice.'),
          status: this.STATUSES[0], // To Do
          priority: this.PRIORITIES[2], // Medium
          issuetype: this.ISSUE_TYPES[1], // Story
          project: this.PROJECTS[1],
          assignee: this.USERS[0],
          reporter: this.USERS[0],
          created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['enhancement', 'ui'],
          sprint: this.SPRINTS[0]
        }
      },
      {
        id: '10003',
        key: 'API-567',
        self: 'https://company.atlassian.net/rest/api/2/issue/10003',
        fields: {
          summary: 'Add rate limiting to public API endpoints',
          description: this.createADF('Implement rate limiting for all public API endpoints to prevent abuse. Should use Redis for distributed rate limiting.'),
          status: this.STATUSES[0], // To Do
          priority: this.PRIORITIES[0], // Highest
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[2],
          assignee: this.USERS[0],
          reporter: this.USERS[2],
          created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['security', 'api'],
          sprint: this.SPRINTS[0]
        }
      },
      {
        id: '10004',
        key: 'DEMO-102',
        self: 'https://company.atlassian.net/rest/api/2/issue/10004',
        fields: {
          summary: 'Update user profile edit form',
          description: this.createADF('Modernize the user profile edit form with better validation and improved UX.'),
          status: this.STATUSES[0], // To Do
          priority: this.PRIORITIES[3], // Low
          issuetype: this.ISSUE_TYPES[1], // Story
          project: this.PROJECTS[0],
          assignee: this.USERS[0],
          reporter: this.USERS[1],
          created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['enhancement']
        }
      },

      // IN PROGRESS issues
      {
        id: '10005',
        key: 'WEB-235',
        self: 'https://company.atlassian.net/rest/api/2/issue/10005',
        fields: {
          summary: 'Database migration for user preferences',
          description: this.createADF('Create and run database migration to add user_preferences table for storing user settings.'),
          status: this.STATUSES[1], // In Progress
          priority: this.PRIORITIES[1], // High
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[1],
          assignee: this.USERS[0],
          reporter: this.USERS[0],
          created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['database', 'migration'],
          sprint: this.SPRINTS[0]
        }
      },
      {
        id: '10006',
        key: 'API-568',
        self: 'https://company.atlassian.net/rest/api/2/issue/10006',
        fields: {
          summary: 'Fix memory leak in websocket connection handler',
          description: this.createADF('There is a memory leak in the websocket connection handler that causes the server to crash after several hours of operation.'),
          status: this.STATUSES[1], // In Progress
          priority: this.PRIORITIES[0], // Highest
          issuetype: this.ISSUE_TYPES[0], // Bug
          project: this.PROJECTS[2],
          assignee: this.USERS[0],
          reporter: this.USERS[2],
          created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 0.25 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['critical', 'performance', 'websocket'],
          sprint: this.SPRINTS[0]
        }
      },
      {
        id: '10007',
        key: 'DEMO-103',
        self: 'https://company.atlassian.net/rest/api/2/issue/10007',
        fields: {
          summary: 'Refactor authentication module',
          description: this.createADF('Refactor the authentication module to use the new OAuth 2.0 flow instead of the deprecated OAuth 1.0.'),
          status: this.STATUSES[1], // In Progress
          priority: this.PRIORITIES[2], // Medium
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[0],
          assignee: this.USERS[0],
          reporter: this.USERS[0],
          created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          labels: ['refactoring', 'auth'],
          sprint: this.SPRINTS[0]
        }
      },

      // IN REVIEW issues
      {
        id: '10008',
        key: 'WEB-236',
        self: 'https://company.atlassian.net/rest/api/2/issue/10008',
        fields: {
          summary: 'Add unit tests for payment processing module',
          description: this.createADF('Increase test coverage for the payment processing module from 45% to at least 80%.'),
          status: this.STATUSES[2], // In Review
          priority: this.PRIORITIES[1], // High
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[1],
          assignee: this.USERS[0],
          reporter: this.USERS[1],
          created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 0.1 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['testing', 'quality'],
          sprint: this.SPRINTS[0]
        }
      },
      {
        id: '10009',
        key: 'API-569',
        self: 'https://company.atlassian.net/rest/api/2/issue/10009',
        fields: {
          summary: 'Implement GraphQL schema for product catalog',
          description: this.createADF('Design and implement GraphQL schema for the product catalog API. Should support filtering, pagination, and sorting.'),
          status: this.STATUSES[2], // In Review
          priority: this.PRIORITIES[2], // Medium
          issuetype: this.ISSUE_TYPES[1], // Story
          project: this.PROJECTS[2],
          assignee: this.USERS[0],
          reporter: this.USERS[2],
          created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          labels: ['api', 'graphql'],
          sprint: this.SPRINTS[0]
        }
      },

      // BLOCKED issues
      {
        id: '10010',
        key: 'DEMO-104',
        self: 'https://company.atlassian.net/rest/api/2/issue/10010',
        fields: {
          summary: 'Integrate with third-party payment gateway',
          description: this.createADF('Integrate with Stripe payment gateway for processing customer payments. Blocked waiting for API keys from vendor.'),
          status: this.STATUSES[4], // Blocked
          priority: this.PRIORITIES[1], // High
          issuetype: this.ISSUE_TYPES[1], // Story
          project: this.PROJECTS[0],
          assignee: this.USERS[0],
          reporter: this.USERS[1],
          created: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['payment', 'integration', 'blocked'],
          sprint: this.SPRINTS[0]
        }
      },

      // DONE issues
      {
        id: '10011',
        key: 'WEB-237',
        self: 'https://company.atlassian.net/rest/api/2/issue/10011',
        fields: {
          summary: 'Fix broken image links in product gallery',
          description: this.createADF('Several product images are showing as broken links. Fixed by updating the CDN URLs.'),
          status: this.STATUSES[3], // Done
          priority: this.PRIORITIES[2], // Medium
          issuetype: this.ISSUE_TYPES[0], // Bug
          project: this.PROJECTS[1],
          assignee: this.USERS[0],
          reporter: this.USERS[1],
          created: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['ui', 'images'],
          sprint: this.SPRINTS[2]
        }
      },
      {
        id: '10012',
        key: 'API-570',
        self: 'https://company.atlassian.net/rest/api/2/issue/10012',
        fields: {
          summary: 'Add caching layer for database queries',
          description: this.createADF('Implemented Redis caching for frequently accessed database queries. Reduced average response time by 60%.'),
          status: this.STATUSES[3], // Done
          priority: this.PRIORITIES[1], // High
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[2],
          assignee: this.USERS[0],
          reporter: this.USERS[0],
          created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['performance', 'caching'],
          sprint: this.SPRINTS[2]
        }
      },
      {
        id: '10013',
        key: 'DEMO-105',
        self: 'https://company.atlassian.net/rest/api/2/issue/10013',
        fields: {
          summary: 'Update dependencies to latest versions',
          description: this.createADF('Updated all npm dependencies to their latest stable versions. All tests passing.'),
          status: this.STATUSES[3], // Done
          priority: this.PRIORITIES[3], // Low
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[0],
          assignee: this.USERS[0],
          reporter: this.USERS[0],
          created: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['maintenance', 'dependencies'],
          sprint: this.SPRINTS[2]
        }
      },

      // Issues without sprint
      {
        id: '10014',
        key: 'WEB-238',
        self: 'https://company.atlassian.net/rest/api/2/issue/10014',
        fields: {
          summary: 'Research progressive web app (PWA) implementation',
          description: this.createADF('Research and document the steps needed to convert our web app into a PWA.'),
          status: this.STATUSES[0], // To Do
          priority: this.PRIORITIES[4], // Lowest
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[1],
          assignee: this.USERS[0],
          reporter: this.USERS[1],
          created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['research', 'pwa']
        }
      },
      {
        id: '10015',
        key: 'API-571',
        self: 'https://company.atlassian.net/rest/api/2/issue/10015',
        fields: {
          summary: 'Document API authentication flow',
          description: this.createADF('Create comprehensive documentation for the API authentication and authorization flow.'),
          status: this.STATUSES[0], // To Do
          priority: this.PRIORITIES[3], // Low
          issuetype: this.ISSUE_TYPES[2], // Task
          project: this.PROJECTS[2],
          assignee: this.USERS[0],
          reporter: this.USERS[2],
          created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          labels: ['documentation', 'auth']
        }
      }
    ];
  }

  /**
   * Create ADF (Atlassian Document Format) from plain text
   */
  private static createADF(text: string): any {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: text
            }
          ]
        }
      ]
    };
  }

  /**
   * Get all dummy issues
   */
  static getAllIssues(): JiraIssue[] {
    if (this.dummyIssues.length === 0) {
      this.initializeDummyIssues();
    }
    return [...this.dummyIssues];
  }

  /**
   * Get issue by key
   */
  static getIssueByKey(key: string): JiraIssue | undefined {
    if (this.dummyIssues.length === 0) {
      this.initializeDummyIssues();
    }
    return this.dummyIssues.find(issue => issue.key === key);
  }

  /**
   * Get issue details (extended version)
   */
  static getIssueDetails(key: string): JiraIssueDetails | undefined {
    const issue = this.getIssueByKey(key);
    if (!issue) {
      return undefined;
    }

    const details: JiraIssueDetails = {
      ...issue,
      renderedFields: {
        description: issue.fields.description ? this.renderADF(issue.fields.description) : ''
      },
      fields: {
        ...issue.fields,
        comment: {
          comments: this.getCommentsForIssue(key),
          maxResults: 50,
          total: 2,
          startAt: 0
        }
      }
    };

    return details;
  }

  /**
   * Render ADF to plain text
   */
  private static renderADF(adf: any): string {
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
   * Get dummy comments for an issue
   */
  private static getCommentsForIssue(issueKey: string): JiraComment[] {
    return [
      {
        id: '1001',
        author: this.USERS[1],
        body: this.createADF('I can reproduce this issue on my device as well. Will need to test the fix on multiple screen sizes.'),
        created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '1002',
        author: this.USERS[0],
        body: this.createADF('Working on a fix. Should have a PR ready by end of day.'),
        created: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  /**
   * Get available transitions for an issue based on current status
   */
  static getTransitions(issueKey: string): JiraTransition[] {
    const issue = this.getIssueByKey(issueKey);
    if (!issue) {
      return [];
    }

    const currentStatus = issue.fields.status.name;

    // Define valid transitions based on current status
    switch (currentStatus) {
      case 'To Do':
        return [
          {
            id: '11',
            name: 'Start Progress',
            to: this.STATUSES[1] // In Progress
          }
        ];
      case 'In Progress':
        return [
          {
            id: '21',
            name: 'Ready for Review',
            to: this.STATUSES[2] // In Review
          },
          {
            id: '22',
            name: 'Block',
            to: this.STATUSES[4] // Blocked
          },
          {
            id: '23',
            name: 'Stop Progress',
            to: this.STATUSES[0] // To Do
          }
        ];
      case 'In Review':
        return [
          {
            id: '31',
            name: 'Done',
            to: this.STATUSES[3] // Done
          },
          {
            id: '32',
            name: 'Back to In Progress',
            to: this.STATUSES[1] // In Progress
          }
        ];
      case 'Blocked':
        return [
          {
            id: '41',
            name: 'Unblock',
            to: this.STATUSES[1] // In Progress
          }
        ];
      case 'Done':
        return [
          {
            id: '51',
            name: 'Reopen',
            to: this.STATUSES[0] // To Do
          }
        ];
      default:
        return [];
    }
  }

  /**
   * Create a new dummy issue
   */
  static createIssue(data: any): CreateIssueResponse {
    const project = this.PROJECTS.find(p => p.key === data.fields.project.key) || this.PROJECTS[0];
    const issueType = this.ISSUE_TYPES.find(t => t.id === data.fields.issuetype.id) || this.ISSUE_TYPES[0];
    const priority = data.fields.priority ?
      this.PRIORITIES.find(p => p.id === data.fields.priority.id) || this.PRIORITIES[2] :
      this.PRIORITIES[2];

    const newIssueId = String(this.nextIssueId++);
    const newIssueNumber = 100 + this.dummyIssues.length;
    const newIssueKey = `${project.key}-${newIssueNumber}`;

    const newIssue: JiraIssue = {
      id: newIssueId,
      key: newIssueKey,
      self: `https://company.atlassian.net/rest/api/2/issue/${newIssueId}`,
      fields: {
        summary: data.fields.summary,
        description: data.fields.description || this.createADF(''),
        status: this.STATUSES[0], // To Do
        priority: priority,
        issuetype: issueType,
        project: project,
        assignee: this.USERS[0], // Current user
        reporter: this.USERS[0],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        labels: data.fields.labels || []
      }
    };

    this.dummyIssues.push(newIssue);

    return {
      id: newIssueId,
      key: newIssueKey,
      self: newIssue.self
    };
  }

  /**
   * Update issue status
   */
  static transitionIssue(issueKey: string, transitionId: string): boolean {
    const issue = this.getIssueByKey(issueKey);
    if (!issue) {
      return false;
    }

    const transitions = this.getTransitions(issueKey);
    const transition = transitions.find(t => t.id === transitionId);
    if (!transition) {
      return false;
    }

    issue.fields.status = transition.to;
    issue.fields.updated = new Date().toISOString();
    return true;
  }

  /**
   * Add comment to issue
   */
  static addComment(issueKey: string, commentText: string): JiraComment {
    const newComment: JiraComment = {
      id: String(this.nextCommentId++),
      author: this.USERS[0], // Current user
      body: this.createADF(commentText),
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // In a real implementation, we'd store this somewhere
    // For now, just return the comment
    return newComment;
  }

  /**
   * Get create metadata for dynamic forms
   */
  static getCreateMetadata(projectKey: string): JiraCreateMetadata {
    const project = this.PROJECTS.find(p => p.key === projectKey) || this.PROJECTS[0];

    return {
      projects: [
        {
          id: project.id,
          key: project.key,
          name: project.name,
          issuetypes: this.ISSUE_TYPES.filter(t => !t.subtask).map(issueType => ({
            id: issueType.id,
            name: issueType.name,
            description: issueType.description,
            subtask: issueType.subtask,
            fields: {
              summary: {
                required: true,
                name: 'Summary',
                key: 'summary',
                schema: { type: 'string' },
                operations: ['set']
              },
              description: {
                required: false,
                name: 'Description',
                key: 'description',
                schema: { type: 'string' },
                operations: ['set']
              },
              priority: {
                required: false,
                name: 'Priority',
                key: 'priority',
                schema: { type: 'priority' },
                operations: ['set'],
                allowedValues: this.PRIORITIES
              },
              labels: {
                required: false,
                name: 'Labels',
                key: 'labels',
                schema: { type: 'array', items: 'string' },
                operations: ['add', 'set', 'remove']
              }
            }
          }))
        }
      ]
    };
  }
}
