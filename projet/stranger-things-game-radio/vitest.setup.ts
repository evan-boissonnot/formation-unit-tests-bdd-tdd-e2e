import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './src/mocks/node'

beforeAll(() => {console.info('listen'); server.listen({ onUnhandledRequest: 'error' })})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())