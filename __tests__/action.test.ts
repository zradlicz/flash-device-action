import {expect, test, jest, describe} from '@jest/globals'
import * as core from '@actions/core'
import {EventEmitter} from 'events'

class MockEventStream extends EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    super()
  }
  cancel(): void {
    return
  }
  abort(): void {
    return
  }
  stopIdleTimeout(): void {
    return
  }
}

const mockFlashDevice = jest.fn()
const mockEventStream = new MockEventStream()
jest.mock('particle-api-js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      flashDevice: mockFlashDevice,
      getEventStream: jest.fn().mockImplementation(() => {
        return mockEventStream
      })
    }
  })
})

// Must import particle-api-js after mocking it
// eslint-disable-next-line import/first
import {
  run,
  flashFirmware,
  waitForDeviceToComeOnline,
  validAccessToken,
  validDeviceId,
  validTimeoutMs,
  validFirmwarePath
} from '../src/action'
describe('waitForDeviceToComeOnline', () => {
  test('test device is online', async () => {
    setTimeout(() => {
      mockEventStream.emit('event', {
        data: 'online'
      })
    }, 500)
    const result = await waitForDeviceToComeOnline('test-device', '1000', 10000)

    expect(result).toEqual(true)
  })

  test('test timeout while waiting for device to come online', async () => {
    const result = waitForDeviceToComeOnline('test-device', '1000', 1000)
    return expect(result).rejects.toThrow(
      'timed out waiting for device to come back online'
    )
  })
})

describe('inputValidation', () => {
  describe('validAccessToken', () => {
    test('should return true for a valid access token', () => {
      const validToken = 'a'.repeat(40)
      expect(validAccessToken(validToken)).toBeTruthy()
    })

    test('should return false for an invalid access token', () => {
      const invalidToken = 'a'.repeat(39)
      expect(validAccessToken(invalidToken)).toBeFalsy()
    })
  })

  describe('validDeviceId', () => {
    test('should return true for a valid device ID', () => {
      const validId = 'a'.repeat(24)
      expect(validDeviceId(validId)).toBeTruthy()
    })

    test('should return false for an invalid device ID', () => {
      const invalidId = 'a'.repeat(23)
      expect(validDeviceId(invalidId)).toBeFalsy()
    })
  })

  describe('validTimeoutMs', () => {
    test('should return true for a valid timeout', () => {
      const validTimeout = 1000
      expect(validTimeoutMs(validTimeout)).toBeTruthy()
    })

    test('should return false for an invalid timeout', () => {
      const invalidTimeout = -1000
      expect(validTimeoutMs(invalidTimeout)).toBeFalsy()
    })
  })

  describe('validFirmwarePath', () => {
    test('should return true for a valid firmware path', () => {
      const validPath = '/path/to/firmware.bin'
      expect(validFirmwarePath(validPath)).toBeTruthy()
    })

    test('should return false for an empty firmware path', () => {
      const invalidPath = ''
      expect(validFirmwarePath(invalidPath)).toBeFalsy()
    })
  })
})

describe('run', () => {
  test('errors with invalid access token', async () => {
    process.env['INPUT_ACCESS-TOKEN'] = 'invalid'
    jest.spyOn(core, 'setFailed')
    run()
    expect(core.setFailed).toHaveBeenCalledWith('invalid access token')
  })

  test('errors with invalid device id', async () => {
    process.env['INPUT_ACCESS-TOKEN'] = 'a'.repeat(40)
    process.env['INPUT_DEVICE-ID'] = 'invalid'
    jest.spyOn(core, 'setFailed')
    run()
    expect(core.setFailed).toHaveBeenCalledWith('invalid device id')
  })

  test('errors with invalid timeout', async () => {
    process.env['INPUT_ACCESS-TOKEN'] = 'a'.repeat(40)
    process.env['INPUT_DEVICE-ID'] = 'a'.repeat(24)
    process.env['INPUT_TIMEOUT-MS'] = '-1000'
    jest.spyOn(core, 'setFailed')
    run()
    expect(core.setFailed).toHaveBeenCalledWith('invalid timeout')
  })

  test('errors with invalid firmware path', async () => {
    process.env['INPUT_ACCESS-TOKEN'] = 'a'.repeat(40)
    process.env['INPUT_DEVICE-ID'] = 'a'.repeat(24)
    process.env['INPUT_TIMEOUT-MS'] = '1000'
    process.env['INPUT_FIRMWARE-PATH'] = ''
    jest.spyOn(core, 'setFailed')
    run()
    expect(core.setFailed).toHaveBeenCalledWith('invalid firmware path')
  })

  test('test flash firmware', async () => {
    setTimeout(() => {
      mockEventStream.emit('event', {
        data: 'online'
      })
    }, 500)
    await flashFirmware({
      accessToken: 'a'.repeat(40),
      deviceId: 'a'.repeat(24),
      firmwarePath: 'test-firmware-path',
      timeoutMs: 10000
    })

    expect(mockFlashDevice).toHaveBeenCalledWith({
      deviceId: 'a'.repeat(24),
      files: {
        file: 'test-firmware-path'
      },
      auth: 'a'.repeat(40)
    })
  })
})
