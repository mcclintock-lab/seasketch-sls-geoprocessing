const toDate = (str) => str ? new Date(str) : null

export const fromJSON = (invocation) => ({
  ...invocation,
  requestedAt: toDate(invocation.requestedAt),
  eta: toDate(invocation.eta),
  deliveredAt: toDate(invocation.deliveredAt)
})
