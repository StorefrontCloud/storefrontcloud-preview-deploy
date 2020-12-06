const {expect} = require('chai')

const appSC = require("../../app/storefrontcloud.js")

describe('getDeployUrl', ()=> {
  it('should retur old version for old projects', ()=> {
    let version = 'abcd1234'
    let namespace = 'project'

    expect(appSC.getDeployUrl(version, namespace)).to.eql(`https://${version}.project.preview.storefrontcloud.io`)
  })

  it('should retur old version for old projects with full namespace', ()=> {
    let version = 'abcd1234'
    let namespace = 'project-storefrontcloud-io'

    expect(appSC.getDeployUrl(version, namespace)).to.eql(`https://${version}.project.preview.storefrontcloud.io`)
  })

  it('should retur new version for projects with region in url', ()=> {
    let version = 'abcd1234'
    let namespace = 'project-europe-west1-gcp-storefrontcloud-io'

    expect(appSC.getDeployUrl(version, namespace)).to.eql(
      `https://${version}.preview.project.europe-west1.gcp.storefrontcloud.io`
    )
  })

})
