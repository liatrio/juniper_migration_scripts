#!/usr/bin/env python3

import argparse
import json
import os
import subprocess
from datetime import datetime
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class GHRepoStatsAnalyzer:
    def __init__(self, github_token: str, org_name: str):
        self.github_token = github_token
        self.org_name = org_name
        self.headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.api_base = 'https://api.github.com'

    def get_team_id(self, team_name: str) -> int:
        """Get GitHub team ID from team name."""
        url = f"{self.api_base}/orgs/{self.org_name}/teams"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        for team in response.json():
            if team['slug'] == team_name:
                return team['id']
        
        raise ValueError(f"Team {team_name} not found in organization {self.org_name}")

    def get_team_repos(self, team_name: str) -> List[str]:
        """Get list of repositories for a team."""
        team_id = self.get_team_id(team_name)
        url = f"{self.api_base}/teams/{team_id}/repos"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        return [repo['name'] for repo in response.json()]

    def get_repo_info(self, repo_name: str) -> Dict:
        """Get repository information from GitHub API."""
        url = f"{self.api_base}/repos/{self.org_name}/{repo_name}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def run_gh_repo_stats(self) -> Dict:
        """Run gh repo-stats on the entire organization."""
        try:
            print(f"\nRunning gh repo-stats for organization {self.org_name}...")
            # Format: gh repo-stats --org <org> --output csv
            cmd = ['gh', 'repo-stats', '--org', self.org_name, '--output', 'csv']
            print(f"Executing command: {' '.join(cmd)}")
            
            # Run command and stream output in real-time
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,  # Line buffered
                universal_newlines=True
            )
            
            # Store output lines for later parsing
            output_lines = []
            
            # Stream stderr in real-time
            for line in process.stderr:
                print(line, end='')
            
            # Collect and stream stdout
            for line in process.stdout:
                print(line, end='')
                output_lines.append(line)
            
            # Wait for process to complete
            return_code = process.wait()
            if return_code != 0:
                print(f"\nError: Command failed with return code {return_code}")
                return {}
            
            print("\nCommand completed successfully")
            
            # Parse the CSV output
            try:
                # Remove empty lines and get headers from first line
                lines = [line.strip() for line in output_lines if line.strip()]
                if not lines:
                    print("Error: No output from gh repo-stats")
                    return {}
                    
                headers = lines[0].strip().split(',')
                stats = {'repositories': []}
                
                # Parse each data line
                for line in lines[1:]:
                    values = line.strip().split(',')
                    if len(values) == len(headers):
                        repo_stats = {}
                        for i, header in enumerate(headers):
                            repo_stats[header] = values[i]
                        stats['repositories'].append(repo_stats)
                
                print(f"\nSuccessfully parsed CSV output ({len(stats['repositories'])} repositories)")
                return stats
            except Exception as e:
                print("Error: Failed to parse CSV output")
                print(f"Exception: {str(e)}")
                return {}
            
        except Exception as e:
            print(f"Error running repo-stats:")
            print(f"Exception type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            return {}

    def analyze_organization(self) -> Dict:
        """Analyze the entire organization."""
        results = {
            'analysis_date': datetime.now().isoformat(),
            'organization': self.org_name
        }

        try:
            print(f"\nAnalyzing organization: {self.org_name}")
            print("-" * 50)
            
            stats = self.run_gh_repo_stats()
            if stats:
                results['stats'] = stats
                print(f"Successfully analyzed organization {self.org_name}")
            else:
                print(f"No statistics were gathered for organization {self.org_name}")
        except Exception as e:
            print(f"Error analyzing organization {self.org_name}:")
            print(f"Exception type: {type(e).__name__}")
            print(f"Error message: {str(e)}")

        return results

    def save_results(self, results: Dict, output_file: str):
        """Save analysis results to a JSON file."""
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)

    def print_summary(self, results: Dict):
        """Print a human-readable summary of the analysis."""
        print("\nRepository Statistics Summary")
        print("=" * 50)
        
        if 'team_name' in results:
            print(f"Team: {results['team_name']}")
        print(f"Analysis Date: {results['analysis_date']}")
        print(f"Repositories Analyzed: {len(results['repositories'])}")
        
        print("\nDetailed Results")
        print("=" * 50)
        
        for repo_name, stats in results['repositories'].items():
            print(f"\nRepository: {repo_name}")
            for key, value in stats.items():
                print(f"  {key}: {value}")

def main():
    parser = argparse.ArgumentParser(
        description='Analyze GitHub organization using gh repo-stats'
    )
    
    parser.add_argument('--token',
                      default=os.getenv('GITHUB_TOKEN'),
                      help='GitHub personal access token (or set GITHUB_TOKEN env var)')
    parser.add_argument('--org',
                      default=os.getenv('GITHUB_ORG'),
                      help='GitHub organization name (or set GITHUB_ORG env var)')
    parser.add_argument('--output', default='org_stats.json',
                      help='Output JSON file path')
    parser.add_argument('--verbose', '-v', action='store_true',
                      help='Enable verbose output')
    
    args = parser.parse_args()
    
    analyzer = GHRepoStatsAnalyzer(args.token, args.org)
    
    try:
        results = analyzer.analyze_organization()
        analyzer.save_results(results, args.output)
        analyzer.print_summary(results)
        print(f"\nDetailed results have been saved to {args.output}")
    except Exception as e:
        print(f"Error: {e}")
        exit(1)

if __name__ == '__main__':
    main()
