import { CH } from '@shared/channels'
import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'

import { GitService } from '../git/gitService'
import { addRecent, getRecents, removeRecent } from '../recents'

import type { CloneParams, CommitParams, DiffParams, DiscardParams, LogParams, PullParams, PushParams, StageParams } from '@shared/types'

const services = new Map<string, GitService>()
/** WebContents id -> active repo path, set by `repo:open`. */
const activePaths = new Map<number, string>()

function getService(event: IpcMainInvokeEvent): GitService {
    const path = activePaths.get(event.sender.id)
    if (!path) throw new Error('No repository is open')
    let service = services.get(path)
    if (!service) {
        service = new GitService(path)
        services.set(path, service)
    }
    return service
}

/** Tells every window the repo changed so the renderer can re-fetch. */
function notifyChanged(path: string): void {
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send(CH.repoChanged, path)
}

export function registerIpc(): void {
    ipcMain.handle(CH.dialogOpenFolder, async () => {
        const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
        return res.canceled || res.filePaths.length === 0 ? null : res.filePaths[0]
    })

    ipcMain.handle(CH.repoOpen, async (event, path: string) => {
        const result = await GitService.open(path)
        if (result.ok) {
            activePaths.set(event.sender.id, path)
            addRecent(path, result.data.name)
        }
        return result
    })

    ipcMain.handle(CH.repoClone, async (event, params: CloneParams) => {
        const result = await GitService.clone(params.url, params.dir)
        if (result.ok) {
            activePaths.set(event.sender.id, params.dir)
            addRecent(params.dir, result.data.name)
            notifyChanged(params.dir)
        }
        return result
    })

    ipcMain.handle(CH.repoRecent, () => getRecents())

    ipcMain.handle(CH.repoRemoveRecent, (_event, path: string) => {
        removeRecent(path)
        return { ok: true, data: null } as const
    })

    ipcMain.handle(CH.logGet, (event, params: LogParams) => getService(event).log(params))
    ipcMain.handle(CH.statusGet, event => getService(event).status())
    ipcMain.handle(CH.diffGet, (event, params: DiffParams) => getService(event).diff(params))

    ipcMain.handle(CH.stageSet, async (event, params: StageParams) => {
        const service = getService(event)
        const result = await service.stage(params)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.discardFile, async (event, params: DiscardParams) => {
        const service = getService(event)
        const result = await service.discard(params)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.commitCreate, async (event, params: CommitParams) => {
        const service = getService(event)
        const result = await service.commit(params)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.branchList, event => getService(event).listBranches())

    ipcMain.handle(CH.branchCheckout, async (event, name: string) => {
        const service = getService(event)
        const result = await service.checkout(name)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.branchCreate, async (event, name: string) => {
        const service = getService(event)
        const result = await service.createBranch(name)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.branchDelete, async (event, name: string) => {
        const service = getService(event)
        const result = await service.deleteBranch(name)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.branchRemote, event => getService(event).listRemoteBranches())

    ipcMain.handle(CH.branchCheckoutRemote, async (event, name: string) => {
        const service = getService(event)
        const result = await service.checkoutRemote(name)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.tagList, event => getService(event).listTags())

    ipcMain.handle(CH.remotePush, async (event, params: PushParams) => {
        const service = getService(event)
        const result = await service.push(params)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.remotePull, async (event, params: PullParams) => {
        const service = getService(event)
        const result = await service.pull(params)
        if (result.ok) notifyChanged(service.path)
        return result
    })

    ipcMain.handle(CH.remoteFetch, async event => {
        const service = getService(event)
        const result = await service.fetch()
        if (result.ok) notifyChanged(service.path)
        return result
    })
}
