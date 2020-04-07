const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const delay = ms => new Promise(r => setTimeout(r, ms));
const getDeployUrl = (version, namespace) => `https://${version}.${namespace}.preview.storefrontcloud.io`
const getCheckUrl = (version, namespace, username, password) => {
  return `https://${username}:${password}@farmer.storefrontcloud.io/deploy_check/${namespace}/${version}`
}

;(async function() {

    const githubToken = core.getInput('token');
    const namespace = core.getInput('namespace');
    const username = core.getInput('username');
    const password = core.getInput('password');
    const { sha: commitHash, repo, payload, issue} = github.context

    const prNumber = payload.pull_request && payload.pull_request.number

    if (!githubToken || !prNumber || !namespace) {
      core.setFailed('Some action arguments are missing. Action has failed.');
      return;
    }

    const deployUrl = getDeployUrl(commitHash, namespace)
    console.log(`Starting deploying PR #${prNumber} on ${deployUrl}`);

    let isSuccess = false;
    const response = await axios.get(deployUrl);
    // try to get the success result for 36 times/3 min
    for (i = 0; i < 36; i++) {
      console.log(`.`);
      try {
        var checkUrl = getCheckUrl(commitHash, namespace, username, password)
        var checkResponse = await axios.get(checkUrl);

        if (checkResponse.data.deployed == '1' && checkResponse.data.ready == '1') {
          console.log(`Your application is successfully deployed.`);
          core.setOutput('preview_url', deployUrl);
          isSuccess = true
          break;
        } else {
          console.log(`.`);
        }
      } catch (e) {
        console.log('e');
      }
      
      await delay(5000);
    }

    isSuccess || core.setFailed(`Your application wasn't deployed or got stuck. Retries limit of 8 (40s) is reached.`);
})()
