import * as core from '@actions/core'

import * as ParticleApi from 'particle-api-js'
const particle = new ParticleApi()

async function run(): Promise<void> {
  try {
    const accessToken = core.getInput('access-token')
    const deviceId = core.getInput('device-id')
    const firmwarePath = core.getInput('firmware-path')
    const timeoutMs = parseInt(core.getInput('timeout-ms'), 10)

    // Flash the device
    await particle.flashDevice({
      deviceId,
      files: {file: firmwarePath},
      auth: accessToken
    })

    // Wait for the flash to complete
    const stream = await particle.getEventStream({
      deviceId,
      auth: accessToken,
      name: 'spark/status'
    })

    await new Promise<void>((resolve, reject) => {
      const flashTimeout = setTimeout(
        () =>
          reject(new Error('timed out waiting for device to come back online')),
        timeoutMs
      )

      stream.on('event', data => {
        if (data.data === 'online') {
          stream.cancel()
          clearTimeout(flashTimeout)
          resolve()
        }
      })
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
