import {expect, test, jest} from '@jest/globals'
import {run, waitForDeviceToComeOnline} from '../src/main'
import * as core from '@actions/core'

test('errors with invalid access token', async () => {
  process.env["INPUT_ACCESS-TOKEN"] = 'invalid'
  jest.spyOn(core, 'setFailed')
  const result = run()
  expect(core.setFailed).toHaveBeenCalledWith('invalid access token')
})
