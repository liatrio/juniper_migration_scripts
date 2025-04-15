# Git Repository Analysis Tools

A set of Python tools to analyze git repositories for GitHub Enterprise Migration (EMU) compatibility.

## Tools Overview

1. `git_repo_size_limit.py`: Analyzes repositories using git-sizer and checks EMU migration limits
2. `gh_repo_stats.py`: Analyzes an entire GitHub organization using gh-repo-stats

## Prerequisites

1. Python 3.6+
2. git-sizer
   ```bash
   brew install git-sizer
   ```
3. GitHub CLI and extensions
   ```bash
   # Install GitHub CLI
   brew install gh

   # Install the repo-stats extension
   gh extension install mona-actions/gh-repo-stats
   ```
4. Python packages
   ```bash
   pip install requests python-dotenv
   ```

## Configuration

Create a `.env` file with your GitHub credentials:
```bash
# Create .env file
echo "GITHUB_TOKEN=your_token_here" >> .env
echo "GITHUB_ORG=your_org_name" >> .env
```

Make sure your GitHub token has these permissions:
- `read:org`
- `repo`

## Usage

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
