const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** Formats an ISO date string (e.g. `%aI` from git log) for display; falls back to the raw string. */
export function formatDate(iso: string): string {
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date)
}

/** Short 7-char form of a commit hash, like GitKraken's abbreviated hashes. */
export function shortHash(hash: string): string {
    return hash.slice(0, 7)
}
