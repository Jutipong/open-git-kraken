export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export interface RepoState {
    path: string
    name: string
    branch: string
    branches: string[]
}

export interface RecentRepo {
    path: string
    name: string
    lastOpened: number
}

export interface CloneParams {
    url: string
    dir: string
}

export interface Commit {
    hash: string
    parents: string[]
    subject: string
    body: string
    authorName: string
    authorEmail: string
    authorDate: string
    /** Ref names attached to this commit (`git log --decorate` output, e.g. `HEAD -> main`, `tag: v1.0`). */
    refs: string[]
}

export interface FileStatus {
    path: string
    index: string
    workingDir: string
}

export interface StatusData {
    branch: string
    ahead: number
    behind: number
    staged: FileStatus[]
    unstaged: FileStatus[]
    untracked: FileStatus[]
}

export interface DiffData {
    content: string
    added: number
    removed: number
}

export interface BranchInfo {
    name: string
    current: boolean
    commit: string
}

export interface LogParams {
    limit?: number
}

export interface DiffParams {
    file?: string
    staged?: boolean
}

export interface StageParams {
    files: string[]
    staged: boolean
}

export interface DiscardParams {
    files: string[]
}

export interface CommitParams {
    message: string
    amend?: boolean
}

export interface PushParams {
    force?: boolean
}

export interface PullParams {
    rebase?: boolean
}

export interface RendererApi {
    dialog: {
        openFolder(): Promise<string | null>
    }
    repo: {
        open(path: string): Promise<Result<RepoState>>
        clone(params: CloneParams): Promise<Result<RepoState>>
        recent(): Promise<RecentRepo[]>
        removeRecent(path: string): Promise<Result<null>>
    }
    log: {
        get(params: LogParams): Promise<Result<Commit[]>>
    }
    status: {
        get(): Promise<Result<StatusData>>
    }
    diff: {
        get(params: DiffParams): Promise<Result<DiffData>>
    }
    stage: {
        set(params: StageParams): Promise<Result<null>>
    }
    discard: {
        file(params: DiscardParams): Promise<Result<null>>
    }
    commit: {
        create(params: CommitParams): Promise<Result<null>>
    }
    branch: {
        list(): Promise<Result<BranchInfo[]>>
        checkout(name: string): Promise<Result<null>>
        create(name: string): Promise<Result<null>>
        delete(name: string): Promise<Result<null>>
    }
    remote: {
        push(params: PushParams): Promise<Result<null>>
        pull(params: PullParams): Promise<Result<null>>
        fetch(): Promise<Result<null>>
    }
    onRepoChanged(cb: (path: string) => void): () => void
}
