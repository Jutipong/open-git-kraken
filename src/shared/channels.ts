export const CH = {
    dialogOpenFolder: 'dialog:openFolder',
    repoOpen: 'repo:open',
    repoRecent: 'repo:recent',
    repoChanged: 'git:repo:changed',
    logGet: 'log:get',
    statusGet: 'status:get',
    diffGet: 'diff:get',
    stageSet: 'stage:set',
    discardFile: 'discard:file',
    commitCreate: 'commit:create',
    branchList: 'branch:list',
    branchCheckout: 'branch:checkout',
    branchCreate: 'branch:create',
    branchDelete: 'branch:delete',
    remotePush: 'remote:push',
    remotePull: 'remote:pull',
    remoteFetch: 'remote:fetch',
} as const

export type Channel = (typeof CH)[keyof typeof CH]
