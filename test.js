(function() {
    var favoritesE = ajax('/Alakerta/favorites/detailed')

    favoritesE.onValue(function(favorites) {
        $('#favorites').html(favorites.map(function(favorite) {
            return '<li class="favorite">' + favorite.title + '</li>'
        }))
    })

    var selectFavoriteE = $('ul').asEventStream('click', '.favorite')
        .map(function(event) {
            return $(event.target).text()
        })
        .flatMapLatest(function(favorite) {
            return ajax('/Alakerta/favorite/' + favorite).map(favorite)
        })

    var clickPlayE = $('.play-pause').asEventStream('click').map($target)
        .map(function(t) {
            return !t.hasClass('pause')
        })
        .flatMapLatest(function(play) {
            return ajax('/Alakerta/' + (play ? 'play' : 'pause')).map(play)
        })

    var serverStateP = Bacon.once('init').concat(selectFavoriteE.merge(clickPlayE)).throttle(1000)
        .flatMapLatest(function() {
            return ajax('/Alakerta/state')
        }).combine(favoritesE, function(state, favorites) {
            return {
                playing: state.playbackState === "PLAYING",
                currentFavorite: favorites.find(function(favorite) {
                    return favorite.uri === state.currentTrack.uri
                })
            }
        })

    serverStateP.onValue(function(state) {
        $('.play-pause').toggleClass('pause', state.playing)
        $('.favorite').removeClass('selected')
        state.currentFavorite &&
            state.currentFavorite.title &&
            favoriteDom(state.currentFavorite.title).addClass('selected')
    })

    var volumeUpE = $('.volume-up').asEventStream('click').map($target)
        .flatMap(function(t) {
            return ajax('/Alakerta/volume/+3')
        })
        .onValue(function() {})

    var volumeDownE = $('.volume-down').asEventStream('click').map($target)
        .flatMap(function(t) {
            return ajax('/Alakerta/volume/-3')
        })
        .onValue(function() {})

    var $controls = $('.control')

    $controls.asEventStream('mousedown').map($target).onValue(function(t) {
        t.addClass('click')
    })

    $controls.asEventStream('mouseup').map($target)
        .onValue(function(t) {
            t.removeClass('click')
        })

    function ajax(url) {
        return Bacon.fromPromise($.ajax({
            url: url,
            dataType: 'json'
        }))
    }

    function favoriteDom(name) {
        return $('.favorite').filter(function() {
            return $(this).text() === name;
        });
    }

    function $target(e) {
        return $(e.target)
    }

})()