(function () {

  const ajax = (url) => Bacon.fromPromise($.ajax({
    url: url,
    dataType: 'json'
  }))

  const favoriteFromDom = name => $('.favorite').filter((i, e) => $(e).text() === name)
  const $target = e => $(e.target)

  const $controls = $('.control')
  const favoritesE = ajax('/Alakerta/favorites/detailed')

  const volumeUpE = $('.volume-up').asEventStream('click')
    .flatMap(() => ajax('/Alakerta/volume/+3'))
    .onValue(() => {
    })

  const volumeDownE = $('.volume-down').asEventStream('click')
    .flatMap(() => ajax('/Alakerta/volume/-3'))
    .onValue(() => {
    })

  const selectFavoriteE = $('ul').asEventStream('click', '.favorite')
    .map($target)
    .doAction((t) => t.find('.state').addClass('spinner'))
    .map(t => t.text())
    .flatMapLatest(favorite => ajax('/Alakerta/favorite/' + favorite).map(favorite))

  const clickPlayE = $('.play-pause').asEventStream('click')
    .map($target)
    .map(t => !t.hasClass('pause'))
    .flatMapLatest(play => ajax('/Alakerta/' + (play ? 'play' : 'pause')).map(play))

  const serverStateP = Bacon.once('init').concat(selectFavoriteE.merge(clickPlayE)).throttle(1000)
    .flatMapLatest(() =>  ajax('/Alakerta/state'))
    .combine(favoritesE, (state, favorites) => ({
        playing: state.playbackState === "PLAYING",
        currentFavorite: favorites.find(favorite => favorite.uri === state.currentTrack.uri)
      })
    ).log("server state")

  favoritesE.onValue(function (favorites) {
    $('#favorites').html(favorites.map(favorite => '<li class="favorite">' + favorite.title + '<span class="state"></span></li>'))
  })

  serverStateP.onValue( state => {
    $('.play-pause').toggleClass('pause', state.playing)
    $('.favorite').removeClass('selected')
    $('.state').removeClass('spinner')
    state.currentFavorite &&
    state.currentFavorite.title &&
    favoriteFromDom(state.currentFavorite.title).addClass('selected')
  })

  $controls.asEventStream('mousedown').map($target).onValue(t => t.addClass('click'))
  $controls.asEventStream('mouseup').map($target).onValue(t => t.removeClass('click'))
})()