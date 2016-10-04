(function () {

  const ajax = (url) => Bacon.fromPromise($.ajax({
    url: url,
    dataType: 'json'
  }))

  const $controls = $('.control')
  const favoriteFromDom = name => $('.favorite').filter(() => $(this).text() === name)
  const $target = e => $(e.target)
  const favoritesE = ajax('/Alakerta/favorites/detailed')

  const volumeUpE = $('.volume-up').asEventStream('click').map($target)
    .flatMap(() => ajax('/Alakerta/volume/+3'))
    .onValue(() => {
    })

  const volumeDownE = $('.volume-down').asEventStream('click').map($target)
    .flatMap(() => ajax('/Alakerta/volume/-3'))
    .onValue(() => {
    })

  const selectFavoriteE = $('ul').asEventStream('click', '.favorite')
    .map(event => $(event.target).text())
    .flatMapLatest(favorite => ajax('/Alakerta/favorite/' + favorite).map(favorite))

  const clickPlayE = $('.play-pause').asEventStream('click').map($target)
    .map(t => !t.hasClass('pause'))
    .flatMapLatest(play => ajax('/Alakerta/' + (play ? 'play' : 'pause')).map(play))

  const serverStateP = Bacon.once('init').concat(selectFavoriteE.merge(clickPlayE)).throttle(1000)
    .flatMapLatest(() =>  ajax('/Alakerta/state'))
    .combine(favoritesE, (state, favorites) => ({
        playing: state.playbackState === "PLAYING",
        currentFavorite: favorites.find(favorite => favorite.uri === state.currentTrack.uri)
      })
    )

  favoritesE.onValue(function (favorites) {
    $('#favorites').html(favorites.map(favorite => '<li class="favorite">' + favorite.title + '</li>'))
  })

  serverStateP.onValue( state => {
    $('.play-pause').toggleClass('pause', state.playing)
    $('.favorite').removeClass('selected')
    state.currentFavorite &&
    state.currentFavorite.title &&
    favoriteFromDom(state.currentFavorite.title).addClass('selected')
  })

  $controls.asEventStream('mousedown').map($target).onValue(t => t.addClass('click'))
  $controls.asEventStream('mouseup').map($target).onValue(t => t.removeClass('click'))
})()