import { mkdir } from 'node:fs/promises'
import { basename, dirname } from 'node:path'

import { simpleGit, type LogOptions, type SimpleGit } from 'simple-git'

import type {
    BranchInfo,
    Commit,
    CommitParams,
    DiffData,
    DiffParams,
    DiscardParams,
    FileStatus,
    LogParams,
    PullParams,
    PushParams,
    RepoState,
    Result,
    StageParams,
    StatusData,
} from '@shared/types'

/**
 * Git on Windows refuses to operate on directories it considers "unsafe" (owned by another user). We whitelist every directory via `-c
 * safe.directory=*` instead of mutating the user's global git config.
 */
const SAFE_DIRECTORY_CONFIG = 'safe.directory=*'

const LOG_FORMAT = {
    hash: '%H',
    parents: '%P',
    subject: '%s',
    body: '%b',
    authorName: '%an',
    authorEmail: '%ae',
    authorDate: '%aI',
    refs: '%D',
} as const

interface LogEntry {
    hash: string
    parents: string
    subject: string
    body: string
    authorName: string
    authorEmail: string
    authorDate: string
    refs: string
}

function toError(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}

function countDiffLines(content: string): { added: number; removed: number } {
    let added = 0
    let removed = 0
    for (const line of content.split('\n')) {
        if (line.startsWith('+') && !line.startsWith('+++')) added++
        else if (line.startsWith('-') && !line.startsWith('---')) removed++
    }
    return { added, removed }
}

/** Runs `fn` and converts any thrown error into a `Result` failure. */
async function wrap<T>(fn: () => Promise<T>): Promise<Result<T>> {
    try {
        return { ok: true, data: await fn() }
    } catch (err) {
        return { ok: false, error: toError(err) }
    }
}

export class GitService {
    readonly path: string
    private readonly git: SimpleGit

    constructor(path: string) {
        this.path = path
        this.git = simpleGit({ baseDir: path, config: [SAFE_DIRECTORY_CONFIG] })
    }

    /** Clones `url` into `dir` (created if needed) and builds the repo state. */
    static async clone(url: string, dir: string): Promise<Result<RepoState>> {
        try {
            await mkdir(dirname(dir), { recursive: true })
            await simpleGit({ baseDir: dirname(dir), config: [SAFE_DIRECTORY_CONFIG] }).clone(url, dir)
        } catch (err) {
            return { ok: false, error: toError(err) }
        }
        return GitService.open(dir)
    }

    /** Validates `path` is a git work tree and builds the initial repo state. */
    static async open(path: string): Promise<Result<RepoState>> {
        const service = new GitService(path)
        try {
            const [status, branchSummary] = await Promise.all([service.git.status(), service.git.branch()])
            return {
                ok: true,
                data: {
                    path,
                    name: basename(path),
                    branch: status.current ?? 'HEAD',
                    branches: branchSummary.all,
                },
            }
        } catch (err) {
            return { ok: false, error: toError(err) }
        }
    }

    log(params: LogParams): Promise<Result<Commit[]>> {
        return wrap(async () => {
            const options: LogOptions<LogEntry> = { format: LOG_FORMAT }
            if (params.limit !== undefined) options.maxCount = params.limit
            try {
                const result = await this.git.log<LogEntry>(options)
                return result.all.map(
                    (entry): Commit => ({
                        hash: entry.hash,
                        parents: entry.parents === '' ? [] : entry.parents.split(' '),
                        subject: entry.subject,
                        body: entry.body,
                        authorName: entry.authorName,
                        authorEmail: entry.authorEmail,
                        authorDate: entry.authorDate,
                        refs: entry.refs === '' ? [] : entry.refs.split(', '),
                    })
                )
            } catch (err) {
                // Unborn HEAD (fresh repo with no commits): `git log` exits 128.
                if (toError(err).includes('does not have any commits yet')) return []
                throw err
            }
        })
    }

    status(): Promise<Result<StatusData>> {
        return wrap(async () => {
            const res = await this.git.status()
            const files: FileStatus[] = res.files.map(file => ({
                path: file.path,
                index: file.index,
                workingDir: file.working_dir,
            }))
            // simple-git returns a space for "no change" in porcelain codes.
            const isSet = (letter: string): boolean => letter !== '' && letter !== ' ' && letter !== '?'
            return {
                branch: res.current ?? 'HEAD',
                ahead: res.ahead,
                behind: res.behind,
                staged: files.filter(file => isSet(file.index)),
                unstaged: files.filter(file => isSet(file.workingDir)),
                untracked: files.filter(file => file.index === '?' || file.workingDir === '?'),
            }
        })
    }

    diff(params: DiffParams = {}): Promise<Result<DiffData>> {
        return wrap(async () => {
            const content = await this.diffContent(params)
            const { added, removed } = countDiffLines(content)
            return { content, added, removed }
        })
    }

    private diffContent(params: DiffParams): Promise<string> {
        if (params.commit) {
            const parent = params.parents?.[0]
            if (!parent) {
                // Root commit has no parent: diff-tree `--root` diffs it against the empty tree (`git diff --root` is not a real mode).
                const paths = params.file ? ['--', params.file] : ['--']
                return this.git.raw(['diff-tree', '-p', '--no-commit-id', '--root', params.commit, ...paths])
            }
            // Commit diff vs its first parent (merge commits diff against the first parent, like GitHub/GitKraken).
            const paths = params.file ? ['--', params.file] : ['--']
            return this.git.diff([parent, params.commit, ...paths])
        }
        const args: string[] = []
        if (params.staged) args.push('--cached')
        args.push('--')
        if (params.file) args.push(params.file)
        return this.git.diff(args)
    }

    stage(params: StageParams): Promise<Result<null>> {
        return wrap(async () => {
            if (params.staged) await this.git.add(params.files)
            else await this.git.reset(['--', ...params.files])
            return null
        })
    }

    discard(params: DiscardParams): Promise<Result<null>> {
        return wrap(async () => {
            await this.git.checkout(['--', ...params.files])
            return null
        })
    }

    commit(params: CommitParams): Promise<Result<null>> {
        return wrap(async () => {
            if (params.amend) {
                // `--amend --no-edit` keeps the previous message; only pass `-m` when a new one is given.
                const args = ['commit', '--amend', '--no-edit']
                if (params.message.trim() !== '') args.push('-m', params.message)
                await this.git.raw(args)
            } else {
                await this.git.raw(['commit', '-m', params.message])
            }
            return null
        })
    }

    listBranches(): Promise<Result<BranchInfo[]>> {
        return wrap(async () => {
            const res = await this.git.branch()
            return res.all.map((name): BranchInfo => {
                const branch = res.branches[name]
                return { name, current: res.current === name, commit: branch?.commit ?? '' }
            })
        })
    }

    checkout(name: string): Promise<Result<null>> {
        return wrap(async () => {
            await this.git.checkout(name)
            return null
        })
    }

    createBranch(name: string): Promise<Result<null>> {
        return wrap(async () => {
            await this.git.checkoutLocalBranch(name)
            return null
        })
    }

    deleteBranch(name: string): Promise<Result<null>> {
        return wrap(async () => {
            await this.git.deleteLocalBranch(name, true)
            return null
        })
    }

    push(params: PushParams = {}): Promise<Result<null>> {
        return wrap(async () => {
            await this.git.push(params.force ? ['--force'] : undefined)
            return null
        })
    }

    pull(params: PullParams = {}): Promise<Result<null>> {
        return wrap(async () => {
            if (params.rebase) await this.git.pull({ '--rebase': null })
            else await this.git.pull()
            return null
        })
    }

    fetch(): Promise<Result<null>> {
        return wrap(async () => {
            await this.git.fetch()
            return null
        })
    }
}
