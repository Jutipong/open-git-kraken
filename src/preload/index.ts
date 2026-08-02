import { CH } from '@shared/channels'
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

import type { RendererApi } from '@shared/types'

const api: RendererApi = {
    dialog: {
        openFolder: () => ipcRenderer.invoke(CH.dialogOpenFolder) as Promise<string | null>,
    },
    repo: {
        open: path => ipcRenderer.invoke(CH.repoOpen, path),
        clone: params => ipcRenderer.invoke(CH.repoClone, params),
        recent: () => ipcRenderer.invoke(CH.repoRecent),
        removeRecent: path => ipcRenderer.invoke(CH.repoRemoveRecent, path),
    },
    log: {
        get: params => ipcRenderer.invoke(CH.logGet, params),
    },
    status: {
        get: () => ipcRenderer.invoke(CH.statusGet),
    },
    diff: {
        get: params => ipcRenderer.invoke(CH.diffGet, params),
    },
    stage: {
        set: params => ipcRenderer.invoke(CH.stageSet, params),
    },
    discard: {
        file: params => ipcRenderer.invoke(CH.discardFile, params),
    },
    commit: {
        create: params => ipcRenderer.invoke(CH.commitCreate, params),
    },
    branch: {
        list: () => ipcRenderer.invoke(CH.branchList),
        checkout: name => ipcRenderer.invoke(CH.branchCheckout, name),
        checkoutRemote: name => ipcRenderer.invoke(CH.branchCheckoutRemote, name),
        create: name => ipcRenderer.invoke(CH.branchCreate, name),
        delete: name => ipcRenderer.invoke(CH.branchDelete, name),
        remote: () => ipcRenderer.invoke(CH.branchRemote),
    },
    tag: {
        list: () => ipcRenderer.invoke(CH.tagList),
    },
    remote: {
        push: params => ipcRenderer.invoke(CH.remotePush, params),
        pull: params => ipcRenderer.invoke(CH.remotePull, params),
        fetch: () => ipcRenderer.invoke(CH.remoteFetch),
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
