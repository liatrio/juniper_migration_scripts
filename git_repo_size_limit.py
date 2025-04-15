#!/usr/bin/env python3

import subprocess
import json
import os
import argparse
import requests
from datetime import datetime
from typing import Dict, List
from urllib.parse import urljoin
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class GitRepoAnalyzer:
    def __init__(self, base_path: str, github_token: str, org_name: str):
        self.base_path = os.path.expanduser(base_path)
        self.github_token = github_token
        self.org_name = org_name
        self.headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.api_base = 'https://api.github.com'
        
    def get_repo_info(self, repo_name: str) -> Dict:
        """Get repository information from GitHub API."""
        url = f"{self.api_base}/repos/{self.org_name}/{repo_name}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_team_id(self, team_name: str) -> int:
        """Get GitHub team ID from team name."""
        url = f"{self.api_base}/orgs/{self.org_name}/teams"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()

        for team in response.json():
            if team['slug'] == team_name:
                return team['id']
        raise ValueError(f"Team '{team_name}' not found in organization '{self.org_name}'")

    def get_team_repos(self, team_name: str) -> List[str]:
        """Get and clone all repositories for a specific team."""
        team_id = self.get_team_id(team_name)
        url = f"{self.api_base}/teams/{team_id}/repos"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()

        team_path = os.path.join(self.base_path, team_name)
        os.makedirs(team_path, exist_ok=True)
        
        repos = []
        for repo in response.json():
            repo_path = os.path.join(team_path, repo['name'])
            if not os.path.exists(repo_path):
                # Clone repository
                clone_url = repo['clone_url'].replace('https://', 
                                                    f'https://x-access-token:{self.github_token}@')
                subprocess.run(['git', 'clone', clone_url, repo_path], 
                             check=True, capture_output=True)
                print(f"Cloned {repo['name']}")
            repos.append(repo_path)
        
        return repos

    def run_git_sizer(self, repo_path: str) -> Dict:
        """Run git-sizer on a repository and return the results."""
        try:
            result = subprocess.run(
                ['git-sizer', '--json'],
                cwd=repo_path,
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"Error analyzing repo {repo_path}: {e}")
            return {}
        except json.JSONDecodeError:
            print(f"Error parsing git-sizer output for {repo_path}")
            return {}

    def analyze_team_repos(self, team_name: str) -> Dict:
        """Analyze all repositories for a given team."""
        repos = self.get_team_repos(team_name)
        results = {
            'team_name': team_name,
            'analysis_date': datetime.now().isoformat(),
            'repositories': {}
        }

        for repo_path in repos:
            repo_name = os.path.basename(repo_path)
            sizer_data = self.run_git_sizer(repo_path)
            if sizer_data:
                results['repositories'][repo_name] = sizer_data

        return results

    def save_results(self, results: Dict, output_file: str):
        """Save analysis results to a JSON file."""
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)

    def format_size(self, size_in_bytes: int) -> str:
        """Convert bytes to human readable format with units."""
        if not isinstance(size_in_bytes, (int, float)):
            return f"{size_in_bytes} (unknown unit)"

        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_in_bytes < 1024.0:
                return f"{size_in_bytes:.2f} {unit}"
            size_in_bytes /= 1024.0
        return f"{size_in_bytes:.2f} TB"

    def print_summary(self, results: Dict):
        """Print a human-readable summary of the analysis."""
        print(f"\nAnalysis Summary for Team: {results['team_name']}")
        print(f"Analysis Date: {results['analysis_date']}")
        print("\nRepository Sizes:")
        print("-" * 60)

        for repo_name, data in results['repositories'].items():
            print(f"\nRepository: {repo_name}")
            
            # Git repository statistics
            print("  Git Repository Stats:")
            if 'unique_blob_size' in data:
                print(f"    Total Blob Size: {self.format_size(data['unique_blob_size'])}")
            if 'max_blob_size' in data:
                print(f"    Largest File Size: {self.format_size(data['max_blob_size'])}")
                if 'max_blob_size_blob' in data:
                    print(f"    Largest File: {data['max_blob_size_blob']}")
            if 'unique_commit_count' in data:
                print(f"    Total Commits: {data['unique_commit_count']}")
            if 'max_history_depth' in data:
                print(f"    History Depth: {data['max_history_depth']} commits")
            
            # EMU Migration Limits Check
            print("\n  EMU Migration Status:")
            violations = []
            
            # 1. 20GB size limit for git repo (total unique content)
            total_size = data.get('unique_blob_size', 0)
            if total_size > 20 * 1024 * 1024 * 1024:  # 20GB
                violations.append(f"Repository exceeds 20GB size limit (Current: {self.format_size(total_size)})")
            
            # 2. 20GB limit for metadata (total size of all commits, trees, etc)
            metadata_size = data.get('unique_commit_size', 0) + data.get('unique_tree_size', 0)
            if metadata_size > 20 * 1024 * 1024 * 1024:  # 20GB
                violations.append(f"Metadata exceeds 20GB limit (Current: {self.format_size(metadata_size)})")
            
            # 3. 400MB file size limit
            max_file_size = data.get('max_blob_size', 0)
            if max_file_size > 400 * 1024 * 1024:  # 400MB
                max_file_path = data.get('max_blob_size_blob', 'unknown')
                violations.append(f"Contains files larger than 400MB limit (Largest: {self.format_size(max_file_size)} - {max_file_path})")
            
            # 4. 255 byte limit for git reference
            max_path_name = data.get('max_path_name_bytes', 0)
            if max_path_name > 255:  # 255 bytes
                max_path = data.get('max_path_name_path', 'unknown')
                violations.append(f"Contains paths longer than 255 bytes (Longest: {max_path_name} bytes - {max_path})")
            
            # 5. 100MB file size recommendation
            if max_file_size > 100 * 1024 * 1024:  # 100MB
                max_file_path = data.get('max_blob_size_blob', 'unknown')
                violations.append(f"Contains files larger than recommended 100MB (Largest: {self.format_size(max_file_size)} - {max_file_path})")
            
            # 6. 2GB size limit for a single git commit
            max_commit_size = data.get('max_commit_size', 0)
            if max_commit_size > 2 * 1024 * 1024 * 1024:  # 2GB
                violations.append(f"Contains commits larger than 2GB limit (Largest: {self.format_size(max_commit_size)})")
            
            # Print results
            if violations:
                print("    ⚠️  EMU Migration Blockers:")
                for violation in violations:
                    print(f"       - {violation}")
            else:
                print("    ✅ All EMU migration checks passed")

def main():
    parser = argparse.ArgumentParser(description='Analyze git repositories using git-sizer')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--team', help='Name of the team whose repositories to analyze')
    group.add_argument('--repos', nargs='+', help='List of repository names to analyze')
    
    parser.add_argument('--base-path', default='~/repos',
                        help='Base path where repositories are stored')
    parser.add_argument('--output', default='repo_analysis.json',
                        help='Output JSON file path')
    parser.add_argument('--token',
                        default=os.getenv('GITHUB_TOKEN'),
                        help='GitHub personal access token (or set GITHUB_TOKEN env var)')
    parser.add_argument('--org',
                        default=os.getenv('GITHUB_ORG'),
                        help='GitHub organization name (or set GITHUB_ORG env var)')
    args = parser.parse_args()

    analyzer = GitRepoAnalyzer(args.base_path, args.token, args.org)
    
    try:
        if args.team:
            results = analyzer.analyze_team_repos(args.team)
        else:
            # Initialize results structure for individual repos
            results = {
                'team_name': 'individual_repos',
                'analysis_date': datetime.now().isoformat(),
                'repositories': {}
            }
            
            # Process each repository
            for repo_name in args.repos:
                try:
                    # Create repo directory structure
                    repo_path = os.path.join(args.base_path, repo_name)
                    os.makedirs(os.path.dirname(repo_path), exist_ok=True)
                    
                    if not os.path.exists(repo_path):
                        # Get repo info and clone
                        repo_info = analyzer.get_repo_info(repo_name)
                        clone_url = repo_info['clone_url'].replace('https://', 
                                                                  f'https://x-access-token:{args.token}@')
                        subprocess.run(['git', 'clone', clone_url, repo_path],
                                     check=True, capture_output=True)
                        print(f"Cloned {repo_name}")
                    
                    # Run git-sizer
                    sizer_data = analyzer.run_git_sizer(repo_path)
                    if sizer_data:
                        results['repositories'][repo_name] = sizer_data
                except Exception as e:
                    print(f"Error processing repository {repo_name}: {e}")
        
        analyzer.save_results(results, args.output)
        analyzer.print_summary(results)
        print(f"\nDetailed results have been saved to {args.output}")
    except Exception as e:
        print(f"Error: {e}")
        exit(1)

if __name__ == '__main__':
    main()
