import type { BranchInfo, Commit, RepoState, StatusData } from '@shared/types'

export const useRepoStore = defineStore('repo', () => {
    const path = ref('')
    const name = ref('')
    const branch = ref('')
    const branches = ref<string[]>([])
    const commits = ref<Commit[]>([])
    const status = ref<StatusData | null>(null)
    const localBranches = ref<BranchInfo[]>([])

    function set(state: RepoState): void {
        path.value = state.path
        name.value = state.name
        branch.value = state.branch
        branches.value = state.branches
    }

    return { path, name, branch, branches, commits, status, localBranches, set }
})
