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

export interface RendererApi {
    dialog: {
        openFolder(): Promise<string | null>
    }
    repo: {
        open(path: string): Promise<RepoState>
        recent(): Promise<RecentRepo[]>
    }
    onRepoChanged(cb: (path: string) => void): () => void
}
