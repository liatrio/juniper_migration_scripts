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
};

if (args.length < 1 || args[0].startsWith('-h') || !org || !credentials.githubConvertedToken) {
  console.error("Usage: node org_summary.js <organization> [--skip-archive] [--skip-fork]");
  console.error("Set GH_PAT environment variable");
  process.exit(1);
}

// Log what we're doing
console.log(`Fetching data for organization: ${org}`);
if (options.skipArchive) console.log('Excluding archived repositories');
if (options.skipFork) console.log('Excluding forked repositories');

async function fetchOrgData() {
  try {
    console.log("Fetching organization and repository information...");
    
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

    console.log(`Successfully wrote organization summary to ./data/${fileName}`);
  } catch (error) {
    console.error("Error fetching organization data:", error);
    process.exit(1);
  }
}

fetchOrgData();
