import { executeQuery } from './config.js';

const getRepositoryQuery = (orgName, cursor = null, options = {}) => ({
  query: `
    query {
      organization(login:"${orgName}") {
        repositories(
          first: 100,
          orderBy: {field: CREATED_AT, direction: DESC}
          ${cursor ? `, after: "${cursor}"` : ''}
          ${options.skipFork ? ', isFork: false' : ''}
          ${options.skipArchive ? ', isArchived: false' : ''}
        ) {
          pageInfo {
            hasNextPage
            endCursor
            startCursor
          }
          totalCount
          nodes {
            name
            diskUsage
            branchProtectionRules(first:100) {
              totalCount
              nodes {
                requiredStatusChecks {
                  app {
                    name
                    id
                    clientId
                    description
                    createdAt
                  }
                }
              }
            }
            commitComments {
              totalCount
            }
            description
            pullRequests {
              totalCount
            }
            issues {
              totalCount
            }
            milestones {
              totalCount
            }
            watchers {
              totalCount
            }
            rulesets {
              totalCount
            }
            packages {
              totalCount
            }
            stargazerCount
            releases {
              totalCount
            }
            deployments {
              totalCount
            }
            hasWikiEnabled
            hasProjectsEnabled
            hasVulnerabilityAlertsEnabled
            archivedAt
            isFork
          }
        }
      }
    }
  `
});

export const getOrganizationRepositories = async (orgName, token, options = {}) => {
  let hasNextPage = true;
  let cursor = null;
  let allRepositories = [];
  let totalCount = 0;

  while (hasNextPage) {
    const query = getRepositoryQuery(orgName, cursor, options);
    const response = await executeQuery(query, token);
    
    const { repositories } = response.data.organization;
    
    // Set total count on first iteration
    if (totalCount === 0) {
      totalCount = repositories.totalCount;
    }

    // Add repositories from this page to our collection
    allRepositories = [...allRepositories, ...repositories.nodes];

    // Update pagination info
    hasNextPage = repositories.pageInfo.hasNextPage;
    cursor = repositories.pageInfo.endCursor;

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Return in the same format as the original query
  return {
    data: {
      organization: {
        repositories: {
          totalCount,
          nodes: allRepositories
        }
      }
    }
  };
};
