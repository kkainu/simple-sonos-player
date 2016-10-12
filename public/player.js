(function () {

  const ajax = (url) => Bacon.fromPromise($.ajax({
    url: 'http://10.0.1.30:5005' + url,
    dataType: 'json'
  }))

  const ws = io('http://localhost:3000')

  const favoriteFromDom = name => $('.favorite').filter((i, e) => $(e).text() === name)
  const $target = e => $(e.target)

  const spinner = '<div class="spinner" />'
  const eq = `<div class="eq">
                <div class="bar-1"></div>
                <div class="bar-2"></div>
                <div class="bar-3"></div>
              </div>`

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

  const clickFavoriteE = $('ul').asEventStream('click', '.favorite')
    .map($target)
    .doAction(t => t.append(spinner))
    .map(t => t.text())

  const selectFavoriteE = clickFavoriteE.flatMapLatest(favorite => ajax('/Alakerta/favorite/' + favorite)).onValue(() => {})

  const clickPlayE = $('.play-pause').asEventStream('click')
    .map($target)
    .map(t => !t.hasClass('pause'))

  const sendPlayE = clickPlayE.flatMapLatest(play => ajax('/Alakerta/' + (play ? 'play' : 'pause'))).onValue(() => {})

  const serverMessages = Bacon.fromBinder(sink => ws.on('message', message => sink(message)))

  const serverStateP = favoritesE.flatMap(() => ajax('/Alakerta/state'))
    .concat(clickFavoriteE.merge(clickPlayE).merge(serverMessages)
      .flatMapLatest(() => ajax('/Alakerta/state'))
    ).combine(favoritesE, (state, favorites) => ({
      playing: state.playbackState === "PLAYING",
      currentFavorite: favorites.find(favorite => favorite.uri === state.currentTrack.uri),
      artist: state.currentTrack.artist,
      title: state.currentTrack.title
    })).log("server state")

  const nowPlaying = state => {
    if (state.currentFavorite) {
      $('.now-playing').text(state.currentFavorite.title)
    } else if (state.artist && state.title) {
      $('.now-playing').text(state.artist + " - " + state.title)
    }
  }

  favoritesE.onValue(function (favorites) {
    $('#favorites').html(favorites.map(favorite => $('<li class="favorite" />').text(favorite.title)))
  })

  serverStateP.onValue(state => {
    $('.play-pause').toggleClass('pause', state.playing)
    $('.favorite').removeClass('selected')
    $('.spinner').remove()
    $('.eq').remove()

    let $selected = state.currentFavorite && favoriteFromDom(state.currentFavorite.title)

    $selected && state.playing && $selected.append(eq)
    $selected && $selected.addClass('selected')
    nowPlaying(state)
  })

  $controls.asEventStream('mousedown').map($target).onValue(t => t.addClass('click'))
  $controls.asEventStream('mouseup').map($target).onValue(t => t.removeClass('click'))

})()