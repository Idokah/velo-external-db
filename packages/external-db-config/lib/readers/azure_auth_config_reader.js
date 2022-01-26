const { checkRequiredKeys } = require('../utils/config_utils')

class AzureAuthConfigReader {
  constructor() {
  }

  async readConfig() {
    const { callbackUrl, clientId, clientSecret } = process.env
    return { callbackUrl, clientId, clientSecret }
  }

  validate() {
    return {
      missingRequiredSecretsKeys: checkRequiredKeys(process.env, ['callbackUrl', 'clientId', 'clientSecret'])
    }
  }
}

module.exports = { AzureAuthConfigReader }
