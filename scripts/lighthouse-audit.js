const lighthouse = require("lighthouse")
const chromeLauncher = require("chrome-launcher")

async function runLighthouseAudit() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] })

  const options = {
    logLevel: "info",
    output: "json",
    onlyCategories: ["performance", "pwa"],
    port: chrome.port,
    settings: {
      emulatedFormFactor: "mobile",
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      },
    },
  }

  const runnerResult = await lighthouse("http://localhost:3000", options)
  await chrome.kill()

  const { lhr } = runnerResult
  const performance = lhr.categories.performance.score * 100
  const pwa = lhr.categories.pwa.score * 100

  console.log(`Performance Score: ${performance}`)
  console.log(`PWA Score: ${pwa}`)

  if (performance < 90) {
    throw new Error(`Performance score ${performance} is below threshold of 90`)
  }

  if (pwa < 80) {
    throw new Error(`PWA score ${pwa} is below threshold of 80`)
  }

  return { performance, pwa }
}

module.exports = runLighthouseAudit
