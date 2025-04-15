# Organization Summary Script

## Usage

This script retrieves organization information using the GitHub GraphQL API.

### Required Arguments

- `organization`: The name of the GitHub organization to query

### Prerequisites

- A GitHub Personal Access Token (PAT) with admin access is required
- The PAT must be set as an environment variable or provided securely to the script
- Node.js is required to run the script

### Example

```bash
npm install
mkdir data
node org_summary.js <organization-name> # outputs to data/org_summary.json

```

Note: The script requires administrative access to the organization to successfully retrieve all data.