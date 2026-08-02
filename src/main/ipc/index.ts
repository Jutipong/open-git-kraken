import { basename } from 'node:path'

import { CH } from '@shared/channels'
import { dialog, ipcMain } from 'electron'

import type { RecentRepo, RepoState } from '@shared/types'

export function registerIpc(): void {
    ipcMain.handle(CH.dialogOpenFolder, async () => {
        const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
        return res.canceled || res.filePaths.length === 0 ? null : res.filePaths[0]
    })

    // Phase 2 (git engine) replaces this placeholder with real git read.
    ipcMain.handle(CH.repoOpen, (_e, path: string): RepoState => {
        return { path, name: basename(path), branch: 'main', branches: [] }
    })

    // Phase 3 (recents in userData) replaces this placeholder.
    ipcMain.handle(CH.repoRecent, (): RecentRepo[] => {
        return []
    })
}
