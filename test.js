var favoritesE = Bacon.fromPromise($.ajax({ url: '/Alakerta/favorites/detailed', dataType: 'json' }))

favoritesE.onValue(function(favorites) { 
  $('#favorites').html(favorites.map(function(favorite) {
    return '<li class="favorite">' + favorite.title + '</li>'
  }))
})

var initialStateE = Bacon.fromPromise($.ajax({ url: '/Alakerta/state', dataType: 'json'})).combine(favoritesE, function(state, favorites) {
  var currentStation = favorites.filter(function(favorite) {
    return favorite.uri === state.currentTrack.uri
  })

  return {
    playing: currentStation && state.playbackState === "PLAYING",
    currentStation: currentStation && currentStation[0]
  }
}).log()

var stationSelectionE = $('ul').asEventStream('click').map(function(event) {
  return $(event.target).text()
})

var selectStationE = stationSelectionE.flatMap(function(station) {
  return $.ajax({ url: '/Alakerta/favorite/' + $(event.target).text(), dataType: 'json' })
}).log()

var currentStation = stationSelectionE.combine(favoritesE, function(station, favorites) {
  return favorites.filter(function(favorite) {
    return favorite.title === station
  })
}).toProperty({}).log('current station: ')

var volumeUpE = $('.volume-up').asEventStream('click').flatMap(function(event) {
  return $.ajax({ url: '/Alakerta/volume/+3', dataType: 'json' })
}).log()

var volumeDownE = $('.volume-down').asEventStream('click').flatMap(function(event) {
  return $.ajax({ url: '/Alakerta/volume/-3', dataType: 'json' })
}).log()

var playPauseE = $('.play-pause').asEventStream('click').map(function(event) {
  return $(event.target).hasClass('pause')
}).flatMap(function(play) {
  var url = '/Alakerta/' + (play ? 'play' : 'pause')
  $.ajax({ url: url, dataType: 'json' })
  return play
})

playPauseE.merge(initialStateE.map(function(state) {
  return state.playing
})).onValue(function(isPlaying) {
  $('.play-pause').toggleClass('pause', !isPlaying)
})

stationSelectionE.onValue(function(val) {
  $('.favorite').removeClass('selected')
  $(event.target).addClass('selected')
})

