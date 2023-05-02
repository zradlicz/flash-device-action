# Particle Flash Device Action
[![Build and Test](https://github.com/particle-iot/flash-device-action/actions/workflows/test.yml/badge.svg)](https://github.com/particle-iot/flash-device-action/actions/workflows/test.yml)

A GitHub Action to flash Particle devices with application firmware

> This project is currently under development with no stable v1 release yet. 
  Documentation refers to the `main` branch, but please be aware that stability guarantees are not provided at this stage.

## Usage

```yaml
- uses: particle-iot/flash-device-action@main
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

### Example Pipeline

This is a simple example of a GitHub Actions pipeline that compiles a firmware project and flashes it to a device.

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
      uses: particle-iot/compile-action@main
      with:
        particle-platform-name: 'argon'
        sources-folder: 'src'

    - name: Flash device
      uses: particle-iot/flash-device-action@main
      with:
        particle-access-token: ${{ secrets.PARTICLE_ACCESS_TOKEN }}
        device-id: 'a3d9e2b1c6f7481234567890'
        firmware-path: ${{ steps.compile.outputs.artifact-path }}
```
