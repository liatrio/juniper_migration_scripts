# GitHub Organization Analysis Tools

A collection of tools to analyze GitHub organizations and repositories, primarily using GraphQL API for detailed repository information.

## GraphQL Organization Summary Tool

The GraphQL Organization Summary tool provides detailed information about a GitHub organization and its repositories, including repository statistics, branch protection rules, and more.

### Prerequisites

1. Node.js 14+
2. GitHub Personal Access Token with these permissions:
   - `read:org`
   - `repo`

### Configuration

Set up your GitHub token as an environment variable:
```bash
export GH_PAT_FG="your_github_token_here"
```

### Usage

The organization summary script supports various options for filtering repositories:

```bash
# Get summary for all repositories in an organization
node graphql/org_summary.js <organization>

# Exclude archived repositories
node graphql/org_summary.js <organization> --skip-archive

# Exclude forked repositories
node graphql/org_summary.js <organization> --skip-fork

# Exclude both archived and forked repositories
node graphql/org_summary.js <organization> --skip-archive --skip-fork
```

Example:
```bash
node graphql/org_summary.js microsoft --skip-archive
```

The script will:
1. Fetch organization information
2. Retrieve repository details (paginated in batches of 100)
3. Generate a JSON report in `graphql/data/org_summary.json`

### Output

The tool generates a detailed JSON report containing:
- Organization details
- Repository information including:
  - Basic metadata (name, description)
  - Branch protection rules
  - Commit statistics
  - Pull request and issue counts
  - Wiki and project settings
  - And more

## Additional Tools

### Git Repository Size Analysis

The `git_repo_size_limit.py` script analyzes repositories using git-sizer to check EMU migration limits.

Prerequisites:
```bash
brew install git-sizer
```

### GitHub Repository Statistics

The `gh_repo_stats.py` script provides organization-wide statistics using the gh-repo-stats extension.

Prerequisites:
```bash
# Install GitHub CLI
brew install gh

# Install the repo-stats extension
gh extension install mona-actions/gh-repo-stats
```

Both tools require Python 3.6+ and the following packages:
```bash
pip install requests python-dotenv
```
### 1. Repository Size Analysis (git_repo_size_limit.py)

This script analyzes repositories using git-sizer and checks EMU migration limits.

a) Analyze by team:
```bash
# Using environment variables from .env
python3 git_repo_size_limit.py --team <team_name> \
    [--base-path PATH] \
    [--output analysis.json]

# Or specify values directly
python3 git_repo_size_limit.py --team <team_name> \
    --token <github_token> \
    --org <organization> \
    [--base-path PATH] \
    [--output analysis.json]
```

b) Analyze specific repositories:
```bash
# Using environment variables from .env
python3 git_repo_size_limit.py --repos repo1 repo2 repo3 \
    [--base-path PATH] \
    [--output analysis.json]

# Or specify values directly
python3 git_repo_size_limit.py --repos repo1 repo2 repo3 \
    --token <github_token> \
    --org <organization> \
    [--base-path PATH] \
    [--output analysis.json]
```

Arguments:
- `--team`: Name of the team whose repositories to analyze
- `--repos`: List of specific repository names to analyze
- `--token`: GitHub Personal Access Token (or set GITHUB_TOKEN env var)
- `--org`: GitHub organization name (or set GITHUB_ORG env var)
- `--base-path`: Base directory for cloning repositories (default: ~/repos)
- `--output`: JSON file to save the analysis results (default: repo_analysis.json)

### 2. Organization Analysis (gh_repo_stats.py)

This script analyzes an entire GitHub organization using gh-repo-stats.

```bash
# Using environment variables from .env
python3 gh_repo_stats.py

# Or specify values directly
python3 gh_repo_stats.py \
    --token <github_token> \
    --org <organization> \
    [--output org_stats.json]
```

Arguments:
- `--token`: GitHub Personal Access Token (or set GITHUB_TOKEN env var)
- `--org`: GitHub organization name (or set GITHUB_ORG env var)
- `--output`: JSON file to save the analysis results (default: org_stats.json)
- `--verbose`: Enable verbose output

## Output Format

### Git-Sizer Analysis (git_repo_size_limit.py)
- Repository statistics:
  - Total repository size
  - Number of files
  - Number of commits
- EMU migration status:
  - ✅ All checks passed, or
  - ⚠️ Migration blockers found:
    - Repository size > 20GB
    - Metadata size > 20GB
    - Individual files > 400MB
    - Git references > 255 bytes
    - Files > 100MB (recommendation)
    - Single commits > 2GB

### Organization Analysis (gh_repo_stats.py)
- CSV format with repository statistics
- Saved to JSON file for further processing

## Example Workflow

1. Analyze team repositories:
```bash
# Run git-sizer analysis
python3 git_repo_size_limit.py --team engineering \
    --output analysis.json

# Get organization statistics
python3 gh_repo_stats.py \
    --output org_stats.json
```

2. Analyze specific repositories:
```bash
# Analyze specific repos
python3 git_repo_size_limit.py --repos repo1 repo2 \
    --output analysis.json

# Get organization statistics
python3 gh_repo_stats.py \
    --output org_stats.json
```
