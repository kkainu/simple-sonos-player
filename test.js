(function () {

  const ajax = (url) => Bacon.fromPromise($.ajax({
    url: url,
    dataType: 'json'
  }))

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

  const selectFavoriteE = $('ul').asEventStream('click', '.favorite')
    .map($target)
    .doAction((t) => t.append(spinner))
    .map(t => t.text())
    .flatMapLatest(favorite => ajax('/Alakerta/favorite/' + favorite))

  const clickPlayE = $('.play-pause').asEventStream('click')
    .map($target)
    .map(t => !t.hasClass('pause'))
    .flatMapLatest(play => ajax('/Alakerta/' + (play ? 'play' : 'pause')))

  const serverStateP = Bacon.once('init').concat(selectFavoriteE.merge(clickPlayE)).throttle(1000)
    .flatMapLatest(() =>  ajax('/Alakerta/state'))
    .combine(favoritesE, (state, favorites) => ({
        playing: state.playbackState === "PLAYING",
        currentFavorite: favorites.find(favorite => favorite.uri === state.currentTrack.uri)
      })
    ).log("server state")

  favoritesE.onValue(function (favorites) {
    $('#favorites').html(favorites.map(favorite => $('<li class="favorite" />').text(favorite.title)))
  })

  serverStateP.onValue( state => {
    $('.play-pause').toggleClass('pause', state.playing)
    $('.favorite').removeClass('selected')
    $('.spinner').remove()
    $('.eq').remove()
    
    let $selected = state.currentFavorite && favoriteFromDom(state.currentFavorite.title)

    $selected && state.playing && $selected.append(eq)
    $selected && $selected.addClass('selected')
  })

  $controls.asEventStream('mousedown').map($target).onValue(t => t.addClass('click'))
  $controls.asEventStream('mouseup').map($target).onValue(t => t.removeClass('click'))

})()