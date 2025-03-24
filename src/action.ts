import * as core from '@actions/core'

import ParticleApi from 'particle-api-js'
const particle = new ParticleApi()

interface FlashFirmwareOptions {
  accessToken: string
  deviceId: string
  firmwarePath: string
  timeoutMs: number
}

const headers = {
  'User-Agent': 'particle-flash-device-action',
  'x-particle-tool': 'particle-flash-device-action'
}

export async function flashFirmware(
  inputs: FlashFirmwareOptions
): Promise<void> {
  const {accessToken, deviceId, firmwarePath, timeoutMs} = inputs

  // Flash the device
  await particle.flashDevice({
    deviceId,
    files: {file: firmwarePath},
    auth: accessToken,
    headers
  })

  core.info('firmware update started')

  // Wait for the flash to complete
  await waitForDeviceToComeOnline(deviceId, accessToken, timeoutMs)
}
export async function waitForDeviceToComeOnline(
  deviceId: string,
  accessToken: string,
  timeoutMs: number
): Promise<boolean> {
  const stream = await particle.getEventStream({
    deviceId,
    auth: accessToken,
    name: 'spark/status'
  })

  return new Promise<boolean>((resolve, reject) => {
    const flashTimeout = setTimeout(() => {
      try {
        stream.end()
      } catch (cleanupError) {
        core.warning(`Error during stream cleanup: ${cleanupError}`)
      }
      reject(new Error('timed out waiting for device to come back online'))
    }, timeoutMs)

    core.info('waiting for device to come online')

    stream.on('event', async (event: {data: string}) => {
      try {
        if (event.data === 'online') {
          core.info('device is online')
          clearTimeout(flashTimeout)
          try {
            stream.end()
          } catch (err) {
            core.warning(`Error during event handler stream cleanup: ${err}`)
          }
          resolve(true)
        }
      } catch (error) {
        core.warning(
          `Error in stream event handler: ${(error as Error).message}`
        )
        reject(new Error('error waiting for device to come online'))
      }
    })
  })
}

export function validAccessToken(accessToken: string): boolean {
  return accessToken.length === 40
}

export function validDeviceId(deviceId: string): boolean {
  return deviceId.length === 24
}

export function validTimeoutMs(timeoutMs: number): boolean {
  return timeoutMs > 0
}

export function validFirmwarePath(firmwarePath: string): boolean {
  return firmwarePath.length > 0
}

export async function run(): Promise<void> {
  try {
    const accessToken = core.getInput('particle-access-token')
    const deviceId = core.getInput('device-id')
    const firmwarePath = core.getInput('firmware-path')
    const timeoutMs = parseInt(core.getInput('timeout-ms'), 10)

    if (!validAccessToken(accessToken)) {
      throw new Error('invalid access token')
    }

    if (!validDeviceId(deviceId)) {
      throw new Error('invalid device id')
    }

    if (!validTimeoutMs(timeoutMs)) {
      throw new Error('invalid timeout')
    }

    if (!validFirmwarePath(firmwarePath)) {
      throw new Error('invalid firmware path')
    }

    // Wait for the device to come online before flashing
    core.info('waiting for device to come online before flashing')
    await waitForDeviceToComeOnline(deviceId, accessToken, timeoutMs)

    core.info('flashing firmware')

    await flashFirmware({
      accessToken,
      deviceId,
      firmwarePath,
      timeoutMs
    })

    core.info('complete!')
    
    // Add a small delay and then explicitly exit the process
    setTimeout(() => {
      process.exit(0)
    }, 2000) // 2 second delay to allow any remaining logs to flush
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    // Exit with error code
    setTimeout(() => {
      process.exit(1)
    }, 2000) // 2 second delay to allow any remaining logs to flush
  }
}
