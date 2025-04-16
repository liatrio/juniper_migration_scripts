import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ });

export const getOrgMembers = async (orgName, token) => {
  const data = await octokit.paginate('GET /orgs/{org}/members', {
    org: orgName,
    per_page: 10,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  return data;
};