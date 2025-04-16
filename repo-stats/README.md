# GitHub Repository Statistics Tool

This tool provides organization-wide repository statistics using the gh-repo-stats GitHub CLI extension.

## Prerequisites

1. GitHub CLI:
   ```bash
   brew install gh
   ```

2. Repo Stats Extension:
   ```bash
   gh extension install mona-actions/gh-repo-stats
   ```

3. Python Requirements:
   ```bash
   pip install requests python-dotenv
   ```

## Features

- Organization-wide repository analysis
- Detailed repository statistics
- CSV and JSON output formats
- Configurable output options

## Usage

### Basic Usage

```bash
# Using environment variables from .env
python3 gh_repo_stats.py

# Or specify values directly
python3 gh_repo_stats.py \
    --token <github_token> \
    --org <organization> \
    [--output org_stats.json]
```

## Arguments

- `--token`: GitHub Personal Access Token (or set GITHUB_TOKEN env var)
- `--org`: GitHub organization name (or set GITHUB_ORG env var)
- `--output`: JSON file to save the analysis results (default: org_stats.json)
- `--verbose`: Enable verbose output

## Output Format

The tool generates two types of output:
1. CSV format with detailed repository statistics
2. JSON file containing processed repository data

### Statistics Include

- Repository name and description
- Creation and last update dates
- Number of forks, stars, and watchers
- Primary language
- Repository size
- Open issues and pull requests
- Branch and tag counts
- Contributor statistics

## Environment Variables

You can set these environment variables in a `.env` file:
```bash
GITHUB_TOKEN=your_token_here
GITHUB_ORG=your_organization
```

## Example Workflow

1. Set up environment variables:
   ```bash
   export GITHUB_TOKEN="your_token_here"
   export GITHUB_ORG="your_organization"
   ```

2. Run the analysis:
   ```bash
   python3 gh_repo_stats.py --output org_stats.json --verbose
   ```

3. Review the generated reports in both CSV and JSON formats.
