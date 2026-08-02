import type { Commit } from '@shared/types'

/**
 * One commit node in the `git2json` shape understood by `@gitgraph/js` `import()`. Refs drive branch/tag coloring: plain refs become
 * branches, `tag: X` refs become tags.
 */
export interface GraphDataNode {
    hash: string
    parents: string[]
    author: { name: string; email: string }
    subject: string
    body: string
    refs: string[]
}

/**
 * Maps `log:get` commits into git2json format for `gitgraph.import()`.
 *
 * `%D` refs look like `HEAD -> main, origin/main, tag: v1.0`. The `HEAD -> X` form is normalized to `X` so branches get clean names; tags
 * keep the `tag: ` prefix for import().
 */
export function toGraphData(commits: Commit[]): GraphDataNode[] {
    return commits.map(commit => ({
        hash: commit.hash,
        parents: commit.parents,
        author: { name: commit.authorName, email: commit.authorEmail },
        subject: commit.subject,
        body: commit.body,
        refs: commit.refs.map(ref => {
            if (ref.startsWith('tag: ')) return ref
            const arrow = ref.indexOf(' -> ')
            return arrow >= 0 ? ref.slice(arrow + 4) : ref
        }),
    }))
}
