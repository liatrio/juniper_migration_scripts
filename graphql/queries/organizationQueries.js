import { executeQuery } from './config.js';

export const getOrganizationInfo = async (orgName, token) => {
  const query = {
    query: `
      query {
        organization(login:"${orgName}") {
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
          repositoryDiscussions {
            totalCount
          }
        }
      }
    `
  };

  return executeQuery(query, token);
};
