import fetch from "node-fetch";

export const baseUrl = "https://api.github.com/graphql";
export const apiBase = "https://api.github.com";

export const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const getApiHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export const executeQuery = async (query, token) => {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(query),
  });
  
  const text = await response.text();
  return JSON.parse(text);
};

// use the REST endpoint for the user list, not available in the GraphQL API
export const executeApiQuery = async (token, path) => {
  const response = await fetch(apiBase + path, {
    method: "GET",
    headers: getApiHeaders(token)
  });
  
  const text = await response.text();
  return JSON.parse(text);
};