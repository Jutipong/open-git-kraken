import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { app } from 'electron'

import type { RecentRepo } from '@shared/types'

const MAX_RECENTS = 20

function recentsPath(): string {
    return join(app.getPath('userData'), 'recents.json')
}

function load(): RecentRepo[] {
    try {
        const raw = readFileSync(recentsPath(), 'utf-8')
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter(
            (r): r is RecentRepo => typeof r === 'object' && r !== null && typeof r.path === 'string' && typeof r.name === 'string'
        )
    } catch {
        return []
    }
}

function save(recents: RecentRepo[]): void {
    const file = recentsPath()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(recents.slice(0, MAX_RECENTS), null, 2))
}

export function getRecents(): RecentRepo[] {
    return load()
}

/** Puts `path` at the front of the list, dedupes by path, caps at MAX_RECENTS. */
export function addRecent(path: string, name: string): void {
    const recents = load().filter(r => r.path !== path)
    recents.unshift({ path, name, lastOpened: Date.now() })
    save(recents)
}

export function removeRecent(path: string): void {
    save(load().filter(r => r.path !== path))
}
