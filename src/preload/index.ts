import { CH } from '@shared/channels'
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

import type { RendererApi } from '@shared/types'

const api: RendererApi = {
    dialog: {
        openFolder: () => ipcRenderer.invoke(CH.dialogOpenFolder) as Promise<string | null>,
    },
    repo: {
        open: (path: string) => ipcRenderer.invoke(CH.repoOpen, path),
        recent: () => ipcRenderer.invoke(CH.repoRecent),
    },
    onRepoChanged: cb => {
        const listener = (_e: IpcRendererEvent, path: string): void => cb(path)
        ipcRenderer.on(CH.repoChanged, listener)
        return () => {
            ipcRenderer.removeListener(CH.repoChanged, listener)
        }
    },
}

contextBridge.exposeInMainWorld('api', api)
