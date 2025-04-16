import fetch from "node-fetch";

export const baseUrl = "https://api.github.com/graphql";

export const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
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
