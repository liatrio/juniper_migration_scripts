import fs from "fs";
import { getOrganizationInfo } from './queries/organizationQueries.js';
import { getOrganizationRepositories } from './queries/repositoryQueries.js';
import { argv } from "process";

const credentials = {
  githubConvertedToken: process.env.GH_PAT
};

// Parse command line arguments
const args = process.argv.slice(2);
const org = args[0];
const ts = new Date().toISOString().replace(/:/g, '-');
const fileName = org + '_org_summary_' + ts + '.json';
// Extract options
const options = {
  skipArchive: args.includes('--skip-archive'),
  skipFork: args.includes('--skip-fork'),
  verbose: args.includes('-v') || args.includes('--verbose')
};

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  verbose: (message) => options.verbose && console.log(`[VERBOSE] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`)
};

if (args.length < 1 || args[0].startsWith('-h') || !org || !credentials.githubConvertedToken) {
  log.error("Usage: node org_summary.js <organization> [--skip-archive] [--skip-fork] [-v|--verbose]");
  log.error("Set GH_PAT environment variable");
  process.exit(1);
}

// Log configuration
log.info(`Fetching data for organization: ${org}`);
if (options.skipArchive) log.info('Excluding archived repositories');
if (options.skipFork) log.info('Excluding forked repositories');
if (options.verbose) log.info('Verbose logging enabled');

log.verbose('Script configuration:');
log.verbose(JSON.stringify({ org, options, outputFile: fileName }, null, 2));

async function fetchOrgData() {
  try {
    log.info("Fetching organization and repository information...");
    
    // Fetch both organization info and repository data in parallel
    const [orgInfo, repoInfo] = await Promise.all([
      getOrganizationInfo(org, credentials.githubConvertedToken),
      getOrganizationRepositories(org, credentials.githubConvertedToken, options)
    ]);

    // Combine the data
    const combinedData = {
      organization: {
        ...orgInfo.data.organization,
        repositories: repoInfo.data.organization.repositories
      }
    };

    // Write the combined data to file
    await fs.promises.writeFile(
      `./data/${fileName}`,
      JSON.stringify(combinedData, null, 2)
    );

    log.success(`Successfully wrote organization summary to ./data/${fileName}`);
  } catch (error) {
    log.error(`Error fetching organization data: ${error.message}`);
    process.exit(1);
  }
}

fetchOrgData();
