import type { RepoState } from '@shared/types'

export const useRepoStore = defineStore('repo', () => {
    const path = ref('')
    const name = ref('')
    const branch = ref('')

    function set(state: RepoState): void {
        path.value = state.path
        name.value = state.name
        branch.value = state.branch
    }

    return { path, name, branch, set }
})
