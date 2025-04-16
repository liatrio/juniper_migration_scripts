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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

export const getOrganizationRepositories = async (orgName, token, options = {}) => {
  // Initialize logging utility with current options
  const log = {
    info: (message) => console.log(`[INFO] ${message}`),
    verbose: (message) => options.verbose && console.log(`[VERBOSE] ${message}`),
    error: (message) => console.error(`[ERROR] ${message}`),
    success: (message) => console.log(`[SUCCESS] ${message}`),
    warn: (message) => console.warn(`[WARN] ${message}`)
  };

  const stats = {
    startTime: Date.now(),
    batchCount: 0,
    retryCount: 0,
    totalRequests: 0
  };
  let hasNextPage = true;
  let cursor = null;
  let allRepositories = [];
  let totalCount = 0;

  while (hasNextPage) {
    stats.batchCount++;
    stats.totalRequests++;
    
    const batchStartTime = Date.now();
    const query = getRepositoryQuery(orgName, cursor, options);
    log.verbose(`Fetching repositories batch ${stats.batchCount}${cursor ? ` after cursor: ${cursor}` : ' (first batch)'}`);
    
    // Add retry logic for API failures
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
    
        response = await executeQuery(query, token);
        const batchDuration = Date.now() - batchStartTime;
        log.verbose(`Batch ${stats.batchCount} completed in ${formatDuration(batchDuration)}`);
        break;
      } catch (error) {
        retryCount++;
        stats.retryCount++;
        stats.totalRequests++;
        
        if (retryCount === maxRetries) {
          throw new Error(`Failed to fetch batch ${stats.batchCount} after ${maxRetries} attempts: ${error.message}`);
        }
        
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 8000); // Exponential backoff
        log.warn(`Attempt ${retryCount}/${maxRetries} failed. Retrying in ${formatDuration(waitTime)}...`);
        await sleep(waitTime);
      }
    }

    const { repositories } = response.data.organization;
    
    log.verbose(`Received ${repositories.nodes.length} repositories in batch ${stats.batchCount}`);
    if (options.verbose) {
      repositories.nodes.forEach(repo => {
        log.verbose(`  - ${repo.name} (${repo.isArchived ? 'archived' : 'active'}, ${repo.isFork ? 'fork' : 'source'})`);
      });
    }
    
    // Set total count on first iteration
    if (totalCount === 0) {
      totalCount = repositories.totalCount;
      log.info(`Found total of ${totalCount} repositories`);
    }

    // Add repositories from this page to our collection
    allRepositories = [...allRepositories, ...repositories.nodes];
    
    // Update pagination info
    hasNextPage = repositories.pageInfo.hasNextPage;
    cursor = repositories.pageInfo.endCursor;
    
    if (hasNextPage) {
      log.verbose('More repositories available, continuing to next page...');
    }

    // Add a small delay to avoid rate limiting
    if (hasNextPage) {
      const waitTime = 1000; // 1 second
      log.verbose(`Rate limiting: waiting ${formatDuration(waitTime)} before next request...`);
      await sleep(waitTime);
    }
  }

  // Log final statistics
  const totalDuration = Date.now() - stats.startTime;
  const avgTimePerBatch = totalDuration / stats.batchCount;
  
  log.success('Repository fetch completed successfully!');
  log.info('Final Statistics:');
  log.info(`- Total Time: ${formatDuration(totalDuration)}`);
  log.info(`- Batches: ${stats.batchCount}`);
  log.info(`- Average Time per Batch: ${formatDuration(avgTimePerBatch)}`);
  log.info(`- Total API Requests: ${stats.totalRequests}`);
  if (stats.retryCount > 0) {
    log.warn(`- Retry Count: ${stats.retryCount}`);
  }
  log.info(`- Repositories: ${allRepositories.length}`);
  
  if (options.skipArchive || options.skipFork) {
    const archivedCount = allRepositories.filter(r => r.isArchived).length;
    const forkedCount = allRepositories.filter(r => r.isFork).length;
    log.info('Repository Breakdown:');
    log.info(`- Source Repos: ${allRepositories.length - forkedCount}`);
    log.info(`- Forked Repos: ${forkedCount}`);
    log.info(`- Active Repos: ${allRepositories.length - archivedCount}`);
    log.info(`- Archived Repos: ${archivedCount}`);
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
