// SET UP THE BASICS

// setting up the game rules

$(function () {
  // GET THE GAME STARTED

  //$('#rules-modal').modal('show');

  $('#rules-modal').modal('show')

  setupGame()

  $('.high-contrast-toggle').click(function () {
    $('.guess-row .weather.guess, #options .weather').addClass('no-delay')
    $('body').toggleClass('high-contrast')
    setTimeout(function () {
      $('.no-delay').removeClass('no-delay')
    }, 100)
  })
})

async function setupGame() {
  $('#options .weather').click(function () {
    thisWeather = $(this).attr('data-type')

    $('.active-row .guess.ready')
      .first()
      .attr('data-type', thisWeather)
      .removeClass('ready') //.text(icons[thisWeather])
  })

  todaysAnswer = game.forecast_enc.replace(/7|8/g, '').split('6')
  todaysAnswer = todaysAnswer.map((x) => x + 'd')

  // SET UP INTERACTIVE ELEMENTS
  $('#controls #delete').click(function () {
    $('.active-row .guess:not(.ready)')
      .last()
      .attr('data-type', '')
      .text('')
      .addClass('ready')
  })

  $('#controls #enter').click(function () {
    if ($('.active-row .guess.ready').length > 0) {
      console.log('everything must be filled in')
    } else {
      keyboardRatingOutput = {}

      submission = []
      $('.active-row .guess').each(function () {
        type = $(this).attr('data-type')
        submission.push(type)
        keyboardRatingOutput[type] = 'wrong'
      })

      outcome = todaysAnswer.map((x) => 'wrong') // this just makes sure the whole thing is long enough
      answerComparator = todaysAnswer.slice()

      submission.forEach(function (type, index) {
        if (type == todaysAnswer[index]) {
          outcome[index] = 'correct'
          answerComparator[index] = 'x'
          keyboardRatingOutput[type] = 'correct'
        }
      })

      submission.forEach(function (type, index) {
        if (outcome[index] != 'correct') {
          findSubmission = answerComparator.indexOf(type)
          if (findSubmission > -1) {
            outcome[index] = 'close'
            answerComparator[findSubmission] = 'x'

            if (keyboardRatingOutput[type] == 'wrong') {
              keyboardRatingOutput[type] = 'close'
            }
          }
        }
      })

      correctTally = 0

      rowScoreData = []
      outcome.forEach(function (oneOutcome, index) {
        // color the guesses
        $(`.active-row .guess:nth(${index})`).attr('data-outcome', oneOutcome)

        //prepare to store in the playerProgress object
        rowScoreData.push({ type: submission[index], outcome: oneOutcome })

        if (oneOutcome == 'correct') {
          correctTally++
        }
      })

      playerProgress.data.rows.push(rowScoreData)

      //color the keyboard
      Object.keys(keyboardRatingOutput).forEach(function (type) {
        if (
          keyboardRatingOutput[type] == 'correct' ||
          keyboardRatingOutput[type] == 'wrong'
        ) {
          playerProgress.data.keyboard[type] = keyboardRatingOutput[type]
          $(`#options .weather[data-type="${type}"]`).attr(
            'data-outcome',
            keyboardRatingOutput[type]
          )
        } else if (keyboardRatingOutput[type] == 'close') {
          if (
            $(`#options .weather[data-type="${type}"]`).attr('data-outcome') !=
            'correct'
          ) {
            playerProgress.data.keyboard[type] = keyboardRatingOutput[type]
            $(`#options .weather[data-type="${type}"]`).attr(
              'data-outcome',
              keyboardRatingOutput[type]
            )
          }
        }
      })

      playerProgress.autoSave()

      $('.active-row').addClass('complete').removeClass('active-row')
      $('#grid .guess-row:not(.complete)').first().addClass('active-row')

      completeLines = $('#grid .guess-row.complete').length

      if (correctTally == 5) {
        playerProgress.data.score = completeLines
        gameComplete()
      } else if (completeLines == 6) {
        playerProgress.data.score = 'X'
        gameComplete()
      }
    }
  })

  await playerProgress.loadGameData()

  $('button#lets-play').html('Play!').prop('disabled', false)
}

function gameComplete(firstTime = true) {
  $('#options .weather').off()
  $('#controls button').off()

  playerProgress.data.gameStatus = 'complete'
  playerProgress.autoSave()

  if (playerProgress.data.score == 'X') {
    $('#complete-modal h2').text('You lost')
    $('#complete-modal #outcome-message').append(
      `<p>Sorry, you ran out of guesses. Better luck tomorrow!</p>`
    )
  } else {
    $('#complete-modal h2').text('You won!')
    $('#complete-modal #outcome-message').append(
      `<p>You won the game in ${playerProgress.data.score} guesses!</p>`
    )
  }

  $('#complete-modal #outcome-message').append(
    `<p>Today's forecast in ${game.city}:</p><div id="correct-forecast"></div>`
  )
  todaysAnswer.forEach(function (type) {
    $('#correct-forecast').append(`<img src="images/weather/${type}.png">`)
  })

  sharableEmoji = ''
  emojiList = { correct: '🟢', close: '🟡', wrong: '⚫' }

  playerProgress.data.rows.forEach((row) => {
    row.forEach((guess, index) => {
      sharableEmoji += emojiList[guess.outcome]
    })
    sharableEmoji += '\n'
  })

  shareText =
    `Cloudle - ${game.city}, ${game.country}: ${playerProgress.data.score}/6\n\n` +
    sharableEmoji
  copyText =
    `Cloudle - ${game.city}, ${game.country}: ${playerProgress.data.score}/6\n\n` +
    sharableEmoji +
    '\n\n' +
    window.location.origin +
    window.location.pathname
  if (
    !navigator.share ||
    !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    /Firefox/i.test(navigator.userAgent)
  ) {
    //desktop:
    $('.share-score').hide()
  } else {
    //mobile:
    $('.copy-score').hide()
  }

  $('#sharing-text').val(copyText)

  $('.share-score').click(function () {
    shareData = {
      title: 'Cloudle',
      text: shareText,
      url: window.location.origin + window.location.pathname,
    }

    navigator.share(shareData)
  })

  if (firstTime == true) {
    modalDelay = 2200
  } else {
    modalDelay = 0
  }
  setTimeout(function () {
    $('#complete-modal').modal('show')
  }, modalDelay)
}

function shareable() {
  $('.guess-row :not(.complete)').remove()
  $('.weather[data-outcome="correct"]').attr('data-outcome', 'reset')
  $('.card').attr('style', 'width: 400px')
}

var playerDataDefault = {
  gameStatus: 'incomplete',
  rows: [],
  keyboard: {},
  score: 'i',
}

const playerProgress = {
  playId: false,

  data: JSON.parse(JSON.stringify(playerDataDefault)), // quick clone of the defaults

  autoSave: function () {
    //we're just going to do the browser storage for now
    //if (userStatus !== 'logged-in'){
    localStorage.setItem(game.gameId, JSON.stringify(playerProgress.data))

    // } else {
    //     $.ajax({
    //         type: "POST",
    //         url: "/data/save-progress",

    //         data: {playId: playerProgress.playId, gameId: game.gameId, data: JSON.stringify(playerProgress.data)},
    //         success: function(response) // todo P2: add an error catcher
    //         {

    //           if (response.playId){playerProgress.playId = response.playId}

    //         }
    //     });

    // }
  },

  loadGameData: async function () {
    //we're just going to do the browser storage for now
    //if (userStatus !== 'logged-in'){
    locallyStoredProgress = localStorage.getItem(game.gameId)
    if (
      !locallyStoredProgress ||
      Object.keys(locallyStoredProgress).length == 0
    ) {
      // new play
      playerProgress.autoSave()

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'level_start' })
    } else {
      playerProgress.data = JSON.parse(locallyStoredProgress)
      playerProgress.processGameData(playerProgress.data)
    }

    // } else {

    //     if ((typeof playData !== "undefined") && (typeof playId !== "undefined")){

    //         playerProgress.playId = playId;
    //         playerProgress.data = playData;
    //         playerProgress.processGameData(playerProgress.data);

    //     } else {

    //         window.dataLayer = window.dataLayer || [];
    //         window.dataLayer.push({'event': 'level_start'});

    //         await $.ajax({
    //             type: "POST",
    //             url: "/data/load-progress",

    //             data: {gameId: game.gameId, dataDefault: JSON.stringify(playerDataDefault)},
    //             success: function(response){ // todo P2: add an error catcher
    //                 if (response.playId){playerProgress.playId = response.playId}
    //                 playerProgress.data = response.data;
    //                 playerProgress.processGameData(playerProgress.data);

    //             }
    //     });
    //     }

    // }
  },

  processGameData: function (data) {
    if (data.gameStatus == 'complete') {
      $('.modal').modal('hide')
      gameComplete(false) // format and show the modal
    }

    $('.guess-row .weather.guess, #options .weather').addClass('no-delay')

    data.rows.forEach((row) => {
      row.forEach((guess, index) => {
        $(`.active-row .guess:nth(${index})`)
          .attr('data-type', guess.type)
          .attr('data-outcome', guess.outcome)
          .removeClass('ready')
      })

      $('.active-row').addClass('complete').removeClass('active-row')
      $('#grid .guess-row:not(.complete)').first().addClass('active-row')
    })

    Object.keys(data.keyboard).forEach(function (type) {
      $(`#options .weather[data-type="${type}"]`).attr(
        'data-outcome',
        data.keyboard[type]
      )
    })

    setTimeout(function () {
      $('.no-delay').removeClass('no-delay')
    }, 100)
  },
}
