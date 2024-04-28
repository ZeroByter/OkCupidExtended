// ==UserScript==
// @name         OkCupid Extended
// @namespace    https://www.okcupid.com/
// @version      0.11
// @description  Extending OkCupid with much-needed features!
// @author       ZeroByter
// @match        https://www.okcupid.com/home
// @match        https://www.okcupid.com/discover
// @icon         https://www.google.com/s2/favicons?sz=64&domain=okcupid.com
// @grant        none
// @run-at document-start
// ==/UserScript==

const collapseContainer = (container) => {
  container.classList.add("okce_collapsedContainer")
}
const openContainer = (container) => {
  container.classList.remove("okce_collapsedContainer")
}
const handleToggleCollapseContainer = (container) => {
  return () => {
    if (container.classList.contains("okce_collapsedContainer")) {
      openContainer(container)
    } else {
      collapseContainer(container)
    }
  }
}

/**
 *
 * @param {HTMLDivElement} container
 * @param {string} string
 * @param {string} tooltip
 */
const generateSectionHeader = (container, string, tooltip) => {
  const headerContainer = document.createElement("button")
  headerContainer.classList.add("okce_HeaderContainer")

  const header = document.createElement("span")
  header.innerHTML = string
  headerContainer.append(header)

  if (tooltip) {
    const tip = document.createElement("span")
    tip.innerHTML = "[?]"
    tip.title = tooltip
    headerContainer.append(tip)
  }

  container.append(headerContainer)

  return headerContainer
}

(function () {
  'use strict';

  const extensionStyles = document.createElement("style")
  extensionStyles.innerHTML = `
    .okce_collapsibleContainer{
      position: relative;
    }
    .okce_collapsedContainer{
      max-height: 20px !important;
      min-height: initial !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
    .okce_collapsedContainer:after{
      content: "";
      position: absolute;
      z-index: 1;
      bottom: 0;
      left: 0;
      pointer-events: none;
      background-image: linear-gradient(to bottom, rgba(90,90,90,0), rgba(90,90,90, 1) 95%);
      width: 100%;
      height: 4em;
    }

    .okce_extensionContainer{
      position: fixed;
      top: 10px;
      left: 10px;
      background: #5a5a5a;
      z-index: 100000;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      max-height: calc(100vh - 20px);
      overflow: auto;
      display: flex;
      flex-direction: column;
    }

    .okce_topHeaderContainer{
      display: flex;
      justify-content: space-between;
    }

    .okce_HeaderContainer{
      font-size: 20px;
      margin-bottom: 4px;
      cursor: pointer;
      color: white;
    }

    .okce_historicMatchesSubContainer{
      display: flex;
      flex-direction: column;
    }

    .okce_autoSkipLocationsContainer{
      display: flex;
      flex-wrap: wrap;
      max-width: 300px;
      gap: 2px;
      overflow: auto;
      position: relative;
      min-height: 400px;
    }

    .okce_autoSkipLocationButton{
      color: white;
      cursor: pointer;
    }

    .okce_pastMatches{
      display: flex;
      flex-direction: column-reverse;
      gap: 2px;
    }

    .okce_pastMatchLink{
      color: #b2b2ff;
    }
  `

  const extensionContainer = document.createElement("div")
  extensionContainer.classList.add("okce_extensionContainer")

  // BEGIN Top header
  const topHeaderContainer = document.createElement("div")
  topHeaderContainer.classList.add("okce_topHeaderContainer")

  const votesRemainingCounter = document.createElement("div")
  votesRemainingCounter.innerHTML = "Votes remaining: 0"
  topHeaderContainer.append(votesRemainingCounter)

  const githubSource = document.createElement("a")
  githubSource.classList.add("okce_pastMatchLink") // Yes, I know this isn't a pastMatchLink, I'm too lazy to make a new class
  githubSource.href = `https://github.com/ZeroByter/OkCupidExtended`
  githubSource.target = "_blank"
  githubSource.innerHTML = "Fork me!"
  topHeaderContainer.append(githubSource)

  extensionContainer.append(topHeaderContainer)
  // END Top header

  // BEGIN Auto skip locations
  const autoSkipLocationHeaderContainer = generateSectionHeader(extensionContainer, "Auto-skip locations", "Locations in red will get auto-skipped automatically")

  const autoSkipLocationsContainer = document.createElement("div")
  autoSkipLocationsContainer.classList.add("okce_autoSkipLocationsContainer")
  extensionContainer.append(autoSkipLocationsContainer)

  autoSkipLocationHeaderContainer.onclick = handleToggleCollapseContainer(autoSkipLocationsContainer)
  collapseContainer(autoSkipLocationsContainer)
  // END Auto skip locations

  // BEGIN Historic matches
  const historicMatchesHeader = generateSectionHeader(extensionContainer, "Past seen users")

  const historicMatchesContainer = document.createElement("div")
  historicMatchesContainer.classList.add("okce_collapsibleContainer")

  const historicMatchesSearch = document.createElement("input")
  historicMatchesSearch.placeholder = "Search past seen users"
  historicMatchesSearch.title = "Search with user's id, name or location"
  historicMatchesContainer.append(historicMatchesSearch)

  const historicMatchesSubContainer = document.createElement("div")
  historicMatchesSubContainer.classList.add("okce_historicMatchesSubContainer")
  historicMatchesContainer.append(historicMatchesSubContainer)

  const onHistoricMatchesSearch = (newValue) => {
    return () => {
      historicMatchesSubContainer.innerHTML = ""

      if (newValue.replace(/ /g, "") == "") {
        return;
      }

      const filteredPastUsers = Object.entries(oldMatchesData).filter(([id, data]) => {
        return id.toString().includes(newValue) || data.location?.toLowerCase().includes(newValue) || data.name?.toLowerCase().includes(newValue)
      })
      filteredPastUsers.sort(([aid, a], [bid, b]) => {
        return b.matchPercent - a.matchPercent
      })

      for (const [pastMatchId, pastMatchData] of filteredPastUsers) {
        const pastMatchLink = document.createElement("a")
        pastMatchLink.classList.add("okce_pastMatchLink")
        pastMatchLink.href = `https://www.okcupid.com/profile/${pastMatchId}`
        pastMatchLink.target = "_blank"
        pastMatchLink.innerHTML = `${pastMatchData.name} - ${pastMatchData.age} - ${pastMatchData.location} - ${pastMatchData.matchPercent}%`
        historicMatchesSubContainer.append(pastMatchLink)
      }
    }
  }

  historicMatchesHeader.onclick = handleToggleCollapseContainer(historicMatchesContainer)
  collapseContainer(historicMatchesContainer)

  let historicMatchesSearchTimeout = -1
  historicMatchesSearch.oninput = (e) => {
    clearTimeout(historicMatchesSearchTimeout)
    historicMatchesSearchTimeout = setTimeout(onHistoricMatchesSearch(e.target.value), 500)
  }

  extensionContainer.append(historicMatchesContainer)
  // END Historic matches

  // BEGIN Past matches
  const pastMatchesHeaderContainer = generateSectionHeader(extensionContainer, "Seen users")

  const pastMatches = document.createElement("div")
  pastMatches.classList.add("okce_pastMatches")
  extensionContainer.append(pastMatches)

  pastMatchesHeaderContainer.onclick = handleToggleCollapseContainer(pastMatches)
  // END Past matches

  const autoSkipLocationNames = JSON.parse(localStorage.getItem("okcExtended_AutoSkipLocationNames") ?? "{}")
  const autoSkipLocationNamesButtonsMap = {}

  const oldMatchesData = JSON.parse(localStorage.getItem("okcExtended_MatchesHistory") ?? "{}")

  const addMatchToHistory = (id, name, age, location, matchPercent) => {
    oldMatchesData[id] = {
      time: Date.now(),
      name,
      age,
      location,
      matchPercent: parseInt(matchPercent.slice(0, -1)),
    }

    localStorage.setItem("okcExtended_MatchesHistory", JSON.stringify(oldMatchesData))
  }

  const toggleAutoSkipLocation = (locationName) => {
    autoSkipLocationNames[locationName].autoSkip = !autoSkipLocationNames[locationName].autoSkip
    localStorage.setItem("okcExtended_AutoSkipLocationNames", JSON.stringify(autoSkipLocationNames))

    const color = autoSkipLocationNames[locationName].autoSkip ? 'rgba(255,0,0,0.25)' : 'rgba(0,255,0,0.25)'

    autoSkipLocationNamesButtonsMap[locationName].style.background = color
  }

  const addAutoSkipLocationButton = (locationName, autoSkip) => {
    const color = autoSkip ? 'rgba(255,0,0,0.25)' : 'rgba(0,255,0,0.25)'

    const autoSkipLocation = document.createElement("button")
    autoSkipLocation.classList.add("okce_autoSkipLocationButton")
    autoSkipLocation.style.background = color
    autoSkipLocation.innerText = locationName
    autoSkipLocation.onclick = () => {
      toggleAutoSkipLocation(locationName)
    }
    autoSkipLocationsContainer.append(autoSkipLocation)

    autoSkipLocationNamesButtonsMap[locationName] = autoSkipLocation
  }

  const addNewAutoSkipLocation = (locationName) => {
    autoSkipLocationNames[locationName] = {
      autoSkip: false,
    }

    localStorage.setItem("okcExtended_AutoSkipLocationNames", JSON.stringify(autoSkipLocationNames))
  }

  for (const autoSkipLocationName in autoSkipLocationNames) {
    const autoSkipLocation = autoSkipLocationNames[autoSkipLocationName]
    addAutoSkipLocationButton(autoSkipLocationName, autoSkipLocation.autoSkip)
  }

  setTimeout(() => {
    document.body.append(extensionContainer)
    document.head.append(extensionStyles)
  }, 1000)

  const updateVotesRemaining = (votes) => {
    votesRemainingCounter.innerHTML = `Votes remaining: ${votes}`
  }

  let lastRealMatchId;

  setInterval(() => {
    const realMatchContainer = document.querySelector(".desktop-dt-wrapper")
    if (realMatchContainer) {
      const realMatchId = realMatchContainer.getAttribute("data-user-id")

      if (realMatchId != lastRealMatchId) {
        const name = document.querySelector(".card-content-header__text").textContent
        const [age, location] = document.querySelector(".card-content-header__location").textContent.split(" • ")
        const matchPercent = document.querySelector(".match-percentage.match-percentage--circle").textContent

        const pastMatchLink = document.createElement("a")
        pastMatchLink.classList.add("okce_pastMatchLink")
        pastMatchLink.href = `https://www.okcupid.com/profile/${realMatchId}`
        pastMatchLink.target = "_blank"
        pastMatchLink.innerHTML = `${name} - ${age} - ${location} - ${matchPercent}`
        pastMatches.append(pastMatchLink)

        if (autoSkipLocationNames[location] === undefined) {
          addNewAutoSkipLocation(location)
          addAutoSkipLocationButton(location, false)
        }

        addMatchToHistory(realMatchId, name, age, location, matchPercent)
      }

      lastRealMatchId = realMatchId
    }
  }, 100)

  setInterval(() => {
    const realMatchContainer = document.querySelector(".desktop-dt-wrapper")
    if (realMatchContainer) {
      const [age, location] = document.querySelector(".card-content-header__location").textContent.split(" • ")

      const autoSkipData = autoSkipLocationNames[location]

      if (autoSkipData !== undefined) {
        if (autoSkipData.autoSkip) {
          document.querySelector(".dt-action-buttons-button.pass").click()
        }
      }
    }
  }, 500)

  const oldFetch = fetch

  fetch = function (url, data) {
    let forwarded;

    if (url.endsWith("WebUserVote")) {
      const newArguments = [...arguments]
      newArguments[1].signal = undefined

      forwarded = oldFetch.apply(this, newArguments)

      forwarded.then(async (response) => {
        const data = await response.clone().json()
        updateVotesRemaining(data.data.userVote.likesRemaining)
      })
    } else {
      forwarded = oldFetch.apply(this, arguments)
    }

    return forwarded
  }
})();