import { executeQuery } from './config.js';

export const getTestQuery = async (token) => {
  const query = {
    query: `
      query {
  organization(login: "Juniper-SSN") {
    name
    login
  }
}
    `
  };

  return executeQuery(query, token);
};