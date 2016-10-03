(function() {
  var favoritesE = ajax('/Alakerta/favorites/detailed')

  favoritesE.onValue(function (favorites) {
    $('#favorites').html(favorites.map(function (favorite) {
      return '<li class="favorite">' + favorite.title + '</li>'
    }))
  })

  var initialStateE = ajax('/Alakerta/state').combine(favoritesE, function (state, favorites) {
    var currentFavorite = favorites.find(function (favorite) {
      return favorite.uri === state.currentTrack.uri
    })

    return {
      playing: currentFavorite && state.playbackState === "PLAYING",
      currentFavorite: currentFavorite
    }
  }).toEventStream()

  var favoriteSelectionE = $('ul').asEventStream('click', '.favorite')
    .map(function (event) { return $(event.target).text() })
    .flatMapLatest(function (favorite) { return ajax('/Alakerta/favorite/' + favorite).map(favorite) })
    .combine(favoritesE, function(favorite, favorites) {
      return favorites.find(function (f) {
        return f.title === favorite
      })
  }).toEventStream()

  var favoriteP = initialStateE
    .map(function(state) { return state.currentFavorite })
    .merge(favoriteSelectionE)
    .onValue(function(favorite){
      $('.favorite').removeClass('selected')
      favorite && favorite.title && favoriteDom(favorite.title).addClass('selected')
    })

  var playClickE = $('.play-pause').asEventStream('click')
    .map(function (event) { return $(event.target).hasClass('pause') })
    .flatMapLatest(function (play) { return ajax('/Alakerta/' + (play ? 'play' : 'pause')).map(!play) })

  var playingP = initialStateE
    .map(function (state) { return state.playing })
    .merge(playClickE)
    .onValue(function(play) {
      $('.play-pause').toggleClass('pause', play)
    })

  var volumeUpE = $('.volume-up').asEventStream('click').flatMap(function (event) {
    return $.ajax({url: '/Alakerta/volume/+3', dataType: 'json'})
  })

  var volumeDownE = $('.volume-down').asEventStream('click').flatMap(function (event) {
    return $.ajax({url: '/Alakerta/volume/-3', dataType: 'json'})
  })

  function ajax(url) {
    console.log("get: " + url)
    return Bacon.fromPromise($.ajax({url:url, dataType: 'json'}))
  }

  function favoriteDom(name) {
    return $('.favorite').filter(function() { return $(this).text() === name; });
  }

})()

