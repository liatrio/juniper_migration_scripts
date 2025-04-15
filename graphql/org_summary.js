import fetch from "node-fetch";
import fs from "fs";

const credentials = {
  githubConvertedToken: process.env.GH_PAT_FG,
  githubUserName: "NeillShazly"
};

const baseUrl = "https://api.github.com/graphql";

const headers = {
  Authorization: `Bearer ${credentials.githubConvertedToken}`,
  "Content-Type": "application/json",
};

const org = process.argv[2];

const org_and_repo_query = {
  query: `
	query {
  organization(login:"${org}") {
    id
    name
    url
    projectsV2 {
      totalCount
    }
    teams {
      totalCount
    }
    membersWithRole {
      totalCount
    }
    # rulesets {
    #   totalCount
    # }
		repositoryDiscussions {
      totalCount
    }
    repositories(last: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
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
        isFork
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
	`,
};

fetch(baseUrl, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(org_and_repo_query),
})
  .then((response) => response.text())
  .then((txt) => {
    const data = JSON.parse(txt);
    console.log("Fetching the Repos Information for the org.\n");
    fs.writeFile(
      "./data/org_summary.json",
      JSON.stringify(data),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  })
  .catch((error) => console.log(JSON.stringify(error)));