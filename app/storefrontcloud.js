const StorefrontCloud = {
  getDeployUrl: function (version, namespace) {
    let url = ''
    let name = namespace.replace('-storefrontcloud-io', '')
    const region = namespace.match(/(\w+-\w+-?\d-(aws|gcp))/)

    if (region == null) {
      url = `https://${version}.${name}.preview.storefrontcloud.io`
    } else {
      let regionUrl = region[0]
      regionUrl = regionUrl.replace("-aws", ".aws")
      regionUrl = regionUrl.replace("-gcp", ".gcp")

      name = name.replace('-' + region[0], '')

      url = `https://${version}.preview.${name}.${regionUrl}.storefrontcloud.io`
    }

    return url
  }
}

module.exports = StorefrontCloud
