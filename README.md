# Particle Flash Device Action
[![Build and Test](https://github.com/particle-iot/flash-device-action/actions/workflows/test.yml/badge.svg)](https://github.com/particle-iot/flash-device-action/actions/workflows/test.yml)

A GitHub Action to flash Particle devices with application firmware

Other Actions for firmware development: [Compile](https://github.com/particle-iot/compile-action) | Flash Device | [Firmware Upload](https://github.com/particle-iot/firmware-upload-action)

> This action is currently in public beta. Please [report](https://community.particle.io/) any issues you encounter.

## Usage

```yaml
- uses: particle-iot/flash-device-action@v1
  with:
    # Particle API access token with permission to flash devices
    # Required: true
    particle-access-token: ''

    # Device ID of the device to be targeted
    # Required: true
    device-id: ''
    
    # Path to firmware binary
    # Required: true
    firmware-path: ''

    # Time in ms to wait for the device to come back online after flashing
    # Required: false
    timeout-ms: '300000'
```

Also see official [Particle documentation](https://docs.particle.io/firmware/best-practices/github-actions/) for more details.

### Example Pipeline

This is a simple example of a GitHub Actions pipeline that compiles a firmware project and flashes it to a device.

You will need to create a GitHub secret named `PARTICLE_ACCESS_TOKEN` with a Particle API access token.
The access token should be an [API User](https://docs.particle.io/getting-started/cloud/cloud-api/#api-users) token.
It needs the `devices:update` scope to flash devices.


```yaml
name: Compile and Flash

# on push to the test branch, compile and flash to the test device
on:
  push:
    branches:
      - test

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Compile firmware
      id: compile
      uses: particle-iot/compile-action@v1
      with:
        particle-platform-name: 'argon'

    - name: Flash device
      uses: particle-iot/flash-device-action@v1
      with:
        particle-access-token: ${{ secrets.PARTICLE_ACCESS_TOKEN }}
        device-id: 'a3d9e2b1c6f7481234567890'
        firmware-path: ${{ steps.compile.outputs.artifact-path }}
```
