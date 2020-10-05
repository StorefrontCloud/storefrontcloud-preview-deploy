const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const delay = ms => new Promise(r => setTimeout(r, ms));
const getDeployUrl = (version, namespace) => `https://${version}.${namespace}.preview.storefrontcloud.io`
const getCheckUrl = (version, namespace, username, password, authType) => {
  url = 'https://'
  if (authType != 'apikey') {
    url = url + username + ':' password + '@'
  }
  return url + `farmer.storefrontcloud.io/deploy_check/${namespace}/${version}`
}

const getDeployStatus = async (version, namespace, username, password, authType) => {
  var checkUrl = getCheckUrl(commitHash, namespace, username, password)
  var headers = {}

  if (authType == 'apikey') {
    headers = {
      'X-User-Id': username,
      'X-Api-Key': password
    }
  }

  var checkResponse = await axios.get(checkUrl, {
    headers: headers
  });

  return checkResponse
}

const getPreviewPodName = async (namespace, username, password) => {
  const response = await axios.get(`https://${username}:${password}@farmer.storefrontcloud.io/instance/${namespace}/pod`)
  const data = response.data;

  
  if (!data || !data.pods) {
    return false;
  }

  const podNameFound = data.pods.find(({name}) => name.includes("vue-storefront-preview"))
  return podNameFound && podNameFound.name
}

const getPreviewPodLogs = async (namespace, username, password) => {
  const podName = await getPreviewPodName(namespace, username, password);
  if (!podName) {
    return;
  }
  const response = await axios.get(`https://${username}:${password}@farmer.storefrontcloud.io/instance/${namespace}/pod/${podName}/log`)
  return response.data;
}

;(async function() {

    const githubToken = core.getInput('token');
    const namespace = core.getInput('namespace');
    const username = core.getInput('username');
    const password = core.getInput('password');
    const authType = core.getInput('authtype');
    const { sha: commitHash, repo, payload, issue} = github.context

    const prNumber = payload.pull_request && payload.pull_request.number

    if (!githubToken || !prNumber || !namespace) {
      core.setFailed('Some action arguments are missing. Action has failed.');
      return;
    }

    if (!authType) {
      authType = 'basicauth'
    }

    const deployUrl = getDeployUrl(commitHash, namespace)
    console.log(`Starting deploying PR #${prNumber} on ${deployUrl}`);

    let isSuccess = false;
    try {
       await axios.get(deployUrl);
    } catch (e) {
      console.log('e');
    }
  
    // try to get the success result for 36 times/3 min
    for (i = 0; i < 36; i++) {
      console.log(`.`);
      try {
        var checkResponse = getDeployStatus(commitHash, namespace, username, password, authType)

        if (checkResponse.data.deployed == '1' && checkResponse.data.ready == '1') {
          console.log(`Your application is successfully deployed.`);
          core.setOutput('preview_url', deployUrl);
          isSuccess = true
          break;
        } else {
          console.log(`.`);
        }
      } catch (e) {
        console.log(e);
      }
      
      await delay(5000);
    }

    if (!isSuccess) {
      try {
        const previewLogs = await getPreviewPodLogs(namespace, username, password);
        console.error('Logs from deploying instance: ', previewLogs);
      } catch (e) {
        console.warn('getPreviewPodLogs', e);
      }
      
    }

    isSuccess || core.setFailed(`Your application wasn't deployed or got stuck. Retries limit of 36 (3min) is reached.`);
})()
