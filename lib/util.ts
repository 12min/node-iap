import invariant from 'invariant'

export function invariantPromise(testValue: boolean, format?: string, ...extra: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            invariant(testValue, format, ...extra)
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}