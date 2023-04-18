import {expect, test, jest} from '@jest/globals'
import {run, waitForDeviceToComeOnline} from '../src/main'
import * as core from '@actions/core'
import {EventEmitter} from 'events'

test('errors with invalid access token', async () => {
  process.env['INPUT_ACCESS-TOKEN'] = 'invalid'
  jest.spyOn(core, 'setFailed')
  const result = run()
  expect(core.setFailed).toHaveBeenCalledWith('invalid access token')
})

class MockEventStream extends EventEmitter {
  constructor() {
    super()
  }
  cancel() {
    return
  }
}

const mockEventStream = new MockEventStream()

jest.mock('particle-api-js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getEventStream: jest.fn().mockImplementation(() => {
        return mockEventStream
      })
    }
  })
})

test('test device is online', async () => {
  const flashTimeout = setTimeout(() => {
    mockEventStream.emit('event', {
      data: 'online'
    })
  }, 500)
  const result = await waitForDeviceToComeOnline('test-device', '1000', 10000)

  expect(result).toEqual(true)
})


test('test timeout while waiting for device to come online', async () => {
  const result = waitForDeviceToComeOnline('test-device', '1000', 1000)
  return expect(result).rejects.toThrow('timed out waiting for device to come back online')
})
