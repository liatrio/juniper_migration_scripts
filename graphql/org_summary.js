import fs from "fs";
import { getOrganizationInfo } from './queries/organizationQueries.js';
import { getOrganizationRepositories } from './queries/repositoryQueries.js';

const credentials = {
  githubConvertedToken: process.env.GH_PAT_FG,
  // githubUserName: "NeillShazly"
  githubUserName: "wai-calvin"
};

// Parse command line arguments
const args = process.argv.slice(2);
const org = args[0];

// Extract options
const options = {
  skipArchive: args.includes('--skip-archive'),
  skipFork: args.includes('--skip-fork')
};

if (!org) {
  console.error("Usage: node org_summary.js <organization> [--skip-archive] [--skip-fork]");
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
      "./data/org_summary.json",
      JSON.stringify(combinedData, null, 2)
    );

    console.log("Successfully wrote organization summary to ./data/org_summary.json");
  } catch (error) {
    console.error("Error fetching organization data:", error);
    process.exit(1);
  }
}

fetchOrgData();
