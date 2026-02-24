export interface ApiResult<T> {
  ok: boolean
  status: number
  data?: T
  errorName?: string
}

export interface RequestApiOptions {
  logContext?: string
}
