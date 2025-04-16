module.exports = {
    get_repos
}

function get_repos(org, cursor=null) {
    const query = `
    query {
  organization(login:"${org}") {
    id
    name
    url
    projectsV2 {
      totalCount
    }
    teams {
      totalCount
    }
    membersWithRole {
      totalCount
    }
    repositories(first: 10, after: "${cursor}",  orderBy: {field: CREATED_AT, direction: DESC}) {
    totalCount
      nodes {
        name
        diskUsage
       
	  }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
  }
}
  }
`
}




- create the initial query
- make the call
- get the response
- check for paging
- if paging, make another call
- repeat
- break when no more paging
- write to file