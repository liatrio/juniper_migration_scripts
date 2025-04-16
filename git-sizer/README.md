# Git Repository Size Analysis Tool

This tool analyzes GitHub repositories using git-sizer to check EMU migration limits and repository statistics.

## Prerequisites

- Git-sizer: Install via Homebrew
  ```bash
  brew install git-sizer
  ```
- Python 3.6+
- Required Python packages:
  ```bash
  pip install requests python-dotenv
  ```

## Features

- Repository size analysis using git-sizer
- EMU migration limit checks
- Team-based or repository-specific analysis
- Detailed statistics output in JSON format

## Usage

### Analyze by Team

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

### Analyze Specific Repositories

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

## Arguments

- `--team`: Name of the team whose repositories to analyze
- `--repos`: List of specific repository names to analyze
- `--token`: GitHub Personal Access Token (or set GITHUB_TOKEN env var)
- `--org`: GitHub organization name (or set GITHUB_ORG env var)
- `--base-path`: Base directory for cloning repositories (default: ~/repos)
- `--output`: JSON file to save the analysis results (default: repo_analysis.json)

## Output Format

The tool generates a JSON report containing:

### Repository Statistics
- Total repository size
- Number of files
- Number of commits

### EMU Migration Status
- ✅ All checks passed, or
- ⚠️ Migration blockers found:
  - Repository size > 20GB
  - Metadata size > 20GB
  - Individual files > 400MB
  - Git references > 255 bytes
  - Files > 100MB (recommendation)
  - Single commits > 2GB

## Environment Variables

You can set these environment variables in a `.env` file:
```bash
GITHUB_TOKEN=your_token_here
GITHUB_ORG=your_organization
```
