import fs from "fs";
import { getOrganizationInfo } from './queries/organizationQueries.js';
import { getOrganizationRepositories } from './queries/repositoryQueries.js';
import { getOrgMembers } from './queries/userQueries.js';
import { argv } from "process";
import { getTestQuery } from './queries/test.js';

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
  orgMembers: args.includes('--org-members'),
  verbose: args.includes('-v') || args.includes('--verbose'),
  test: args.includes('--test')
};

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  verbose: (message) => options.verbose && console.log(`[VERBOSE] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`)

};


if (options.test) {
  log.info('Running test query...');
  try {
    const data = await getTestQuery(credentials.githubConvertedToken);
    console.log(JSON.stringify(data, null, 2));
    log.success('Test query completed successfully');
    process.exit(0);
  } catch (error) {
    log.error(`Test query failed: ${error.message}`);
    process.exit(1);
  }
}

// Log configuration
log.info(`Fetching data for organization: ${org}`);
if (options.skipArchive) log.info('Excluding archived repositories');
if (options.skipFork) log.info('Excluding forked repositories');
if (options.verbose) log.info('Verbose logging enabled');

log.verbose('Script configuration:');
log.verbose(JSON.stringify({ org, options, outputFile: fileName }, null, 2));

if (options.test) {
  log.info('Running test query...');
  try {
    const data = await getTestQuery(credentials.githubConvertedToken);
    console.log(JSON.stringify(data, null, 2));
    log.success('Test query completed successfully');
    process.exit(0);
  } catch (error) {
    log.error(`Test query failed: ${error.message}`);
    process.exit(1);
  }
}

if (options.orgMembers) {
  try {
  console.log('Fetching organization members');
  const data = await getOrgMembers(org, credentials.githubConvertedToken);
  await fs.promises.writeFile(
    `./data/members_${fileName}`,
    JSON.stringify(data, null, 2)
  );
  } catch (error) {
    console.error("Error fetching organization members:", error);
    process.exit(1);
  }
  log.success(`Successfully wrote organization members to ./data/members_${fileName}`);
}

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
