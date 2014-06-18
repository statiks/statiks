/**
 * API namespace with related methods
 * Success, fail, reload and API connects
 * @global
 */
var api = {
  /**
   * Alert messages
   */
  errorApi: 'Data from API are incorrect.',
  errorUsername: ' is not found.',
  noUpdate: 'Nothing new :(',

  /**
   * Success fallback when retrieve data
   */
  success: function($this, site, username, followers, details) {
    var success = $('<span class="icon-check"></span>');

    $this.find('input').blur();
    $this.find('.icon-error, .icon-clear, .api-loader').remove();

    /*
    * Display the check icon during a short time
    * Not add it on the DOM again, if is already append
    */
    if ( !$this.find('.icon-check').length ) {
      $this.append(success);

      setTimeout(function() {
        $this.find('.icon-check').remove();
      }, timingEffect * 3);
    }

    /*
    * Check if localstorage exist
    * Push data to object and store it
    */
    if (localStorage !== null) {
      dataObj.sites[site] = {
        username: username,
        followers: followers,
        details: details,
        diff: {
          value: 0,
          followers: [0, 0, 0, 0, 0, 0, 0],
          following: [0, 0, 0, 0, 0, 0, 0]
        }
      };

      storage.set('user-data', dataObj);
    }
  },

  /**
   * Fail fallback when can't retrieve data
   */
  fail: function($this, alert) {
    var error = $('<span class="icon-error"></span>');

    /*
    * Display the cross icon during a short time
    * Not add it on the DOM again, if is already append
    */
    if ( $this !== null ) {
      $this.find('input').val('');
      $this.find('.icon-check, .icon-clear, .api-loader').remove();

      if ( !$this.find('.icon-error').length ) {
        $this.append(error);

        setTimeout(function() {
          $this.find('.icon-error').remove();
        }, timingEffect * 3);
      }
    }

    /*
    * Display alert when an error occured
    */
    if (alert) {
      // Not add it on the DOM again, if is already append
      if ( !$('.alert').length ) {
        var alertWrapper = '<div class="alert"><p></p></div>';
        $(alertWrapper).insertAfter('header');
      }

      $('.alert').animate({
        marginTop: '41px',
        opacity: '1'
      }, timingEffect).find('p').text(alert);

      setTimeout(function() {
        $('.alert').animate({
          marginTop: '-41px',
          opacity: '0'
        }, timingEffect);
      }, 4000);
    }
  },

  /**
   * Method to reload data and store on another object
   * the diff since the last app launched.
   */
  reload: function($this, site, followers, details) {
    // Build data for graph
    for (var i = 0; i < dataObj.graph.followers.length; i++) {
      if ( dataObj.graph.followers[i] === 0 ) {
        dataObj.sites[site].diff.followers[i] = followers;
        if (dataObj.sites[site].details.hasOwnProperty('following')) dataObj.sites[site].diff.following[i] = details.following;

        break;
      }
    }

    // Push to localstorage
    storage.set('user-data', dataObj);

    if ( dataObj.sites[site].followers !== followers ) {
      var diff = followers - dataObj.sites[site].followers;
      var socialItem = $('.list-social').find('.' + site + ' .right');
      var totalItem = $('.total').find('.right');

      // Update value of object
      dataObj.sites[site].diff.value = diff;
      dataObj.sites[site].followers = followers;

      // Push to localstorage
      storage.set('user-data', dataObj);

      // Render new data for each networks
      socialItem.find('.nbr').text(format(followers));
      socialItem.find('p span').text((diff > 0 ? '+' : '') + diff);

      var totalFollowers = 0;
      var totalDiff = 0;

      for (site in dataObj.sites) {
        totalFollowers += parseInt(dataObj.sites[site].followers);
        totalDiff += parseInt(dataObj.sites[site].diff.value);
      }

      totalItem.find('.nbr').text(format(totalFollowers));
      if ( totalDiff !== null && typeof totalDiff === 'number' ) totalItem.find('p span').text((totalDiff > 0 ? '+' : '') + totalDiff);
    } else if ( JSON.stringify(dataObj.sites[site].details) !== JSON.stringify(details) ) {
      // Update value of object
      dataObj.sites[site].details = details;

      // Push to localstorage
      storage.set('user-data', dataObj);

      for (var key in details) {
        $('.' + site).find('.' + key + ' .right').text(format(details[key]));
      }
    } else {
      api.notification();
    }
  },

  graph: function() {
    $.each(dataObj.graph.followers, function(i, data) {
      if ( data === 0 ) {
        for (site in dataObj.sites) {
          dataObj.graph.followers[i] += parseInt(dataObj.sites[site].diff.followers[i]);
          dataObj.graph.following[i] += parseInt(dataObj.sites[site].diff.following[i]);
        }
      }
    });

    storage.set('user-data', dataObj);
  },

  upgrade: function($this, site, followers, details) {
    dataObj.sites[site].followers = followers;
    dataObj.sites[site].details = details;
    dataObj.sites[site].diff = 0;
    storage.set('user-data', dataObj);

    setTimeout(function() {
      $('.loading').fadeOut(timingEffect);

      setTimeout(function() {
        data.build();
      }, timingEffect);
    }, timingEffect * 6);
  },

  notification: function() {
    reload++;

    if ( Object.keys(dataObj.sites).length == reload ) {
      api.fail(null, api.noUpdate);
    }
  },

  /**
   * Dribbble API connection
   */
  dribbble: function($this, value, site) {
    $.getJSON('http://api.dribbble.com/' + value, function(data) {
      var username = data.username;
      var followers = data.followers_count;

      var details = {
        following: data.following_count,
        likes: data.likes_received_count,
        comments: data.comments_received_count,
        shots: data.shots_count
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Twitter scrapper and catch followers from json on the page
   */
  twitter: function($this, value, site) {
    $.ajax({
      url: 'https://twitter.com/' + value,
      success: function(data) {
        data = data.replace(/&quot;/g, '"');

        var getFollowers = data.match(/\"followers_count\":([^\,]+)/);
        var getFollowing = data.match(/\"friends_count\":([^\,]+)/);
        var getTweets = data.match(/\"statuses_count\":([^\,]+)/);
        var getFavorites = data.match(/\"favourites_count\":([^\,]+)/);
        var getListed = data.match(/\"listed_count\":([^\,]+)/);

        var username = value;
        var followers = getFollowers[1];

        var details = {
          following: getFollowing[1],
          tweets: getTweets[1],
          favorites: getFavorites[1],
          listed: getListed[1]
        };

        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Behance API connection
   */
  behance: function($this, value, site) {
    $.getJSON('https://www.behance.net/v2/users/' + value + '?api_key=pEb2TjTxS31kT7fv2TPma6WK8WF8Mlgf', function(data) {
      var username = data.user.username;
      var followers = data.user.stats.followers;

      var details = {
        following: data.user.stats.following,
        likes: data.user.stats.appreciations,
        comments: data.user.stats.comments,
        views: data.user.stats.views
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * 500px API connection
   */
  cinqcentpx: function($this, value, site) {
    $.getJSON('https://api.500px.com/v1/users/show?username=' + value + '&consumer_key=GKHCkl4MdEE2rCFLVeIOWbYxhgk06s69xKnUzad3', function(data) {
      var username = data.user.username;
      var followers = data.user.followers_count;

      var details = {
        following: data.user.friends_count,
        affection: data.user.affection,
        favorites: data.user.in_favorites_count,
        photos: data.user.photos_count,
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * GitHub API connection
   */
  github: function($this, value, site) {
    $.getJSON('https://api.github.com/users/' + value, function(data) {
      var username = data.login;
      var followers = data.followers;

      var details = {
        following: data.following,
        repo: data.public_repos,
        gist: data.public_gists
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Vimeo API connection
   */
  vimeo: function($this, value, site) {
    $.getJSON('http://vimeo.com/api/v2/' + value + '/info.json', function(data) {
      var username = value;
      var followers = data.total_contacts;

      var details = {
        videos: data.total_videos_uploaded,
        likes: data.total_videos_liked,
        albums: data.total_albums
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Instagram scrapper and catch followers from json on the page
   */
  instagram: function($this, value, site) {
    $.ajax({
      url: 'http://instagram.com/' + value,
      success: function(data) {
        data = data.replace(/\\/g, '');

        var getFollowers = data.match(/\"followed_by\":([^\,]+)/g);
        var getFollowing = data.match(/\"follows\":([^\}]+)/g);
        var getMedias = data.match(/\"media\":([^\,]+)/g);

        var username = value;
        var followers = isMac ? getFollowers[1].substr(getFollowers[1].indexOf(':') + 1) : getFollowers[0].substr(getFollowers[0].indexOf(':') + 1);

        var details = {
          following: getFollowing[0].substr(getFollowing[0].indexOf(':') + 1),
          medias: getMedias[0].substr(getMedias[0].indexOf(':') + 1)
        };

        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Pinterest scrapper and catch followers from json on the page
   */
  pinterest: function($this, value, site) {
    $.ajax({
      url: 'http://www.pinterest.com/' + value,
      success: function(data) {
        data = data.replace(/\\/g, '');

        var getFollowers = data.match(/\"follower_count\":([^\,]+)/g);
        var getFollowing= data.match(/\"following_count\":([^\,]+)/g);
        var getPins = data.match(/\"pin_count\":([^\,]+)/g);
        var getBoards = data.match(/\"board_count\":([^\,]+)/g);
        var getLikes = data.match(/\"like_count\":([^\,]+)/g);

        var username = value;
        var followers = getFollowers[1].substr(getFollowers[1].indexOf(' ') + 1);

        var details = {
          following: getFollowing[1].substr(getFollowing[1].indexOf(' ') + 1),
          pins: getPins[1].substr(getPins[1].indexOf(' ') + 1),
          boards: getBoards[1].substr(getBoards[1].indexOf(' ') + 1),
          likes: getLikes[1].substr(getLikes[1].indexOf(' ') + 1)
        };

        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Youtube API connection
   */
  youtube: function($this, value, site) {
    $.getJSON('https://gdata.youtube.com/feeds/api/users/' + value + '?v=2&alt=json', function(data) {
      var username = data.entry.yt$username.$t;
      var followers = data.entry.yt$statistics.subscriberCount;

      var details = {
        views: data.entry.yt$statistics.totalUploadViews
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Forrst API connection
   */
  forrst: function($this, value, site) {
    $.getJSON('https://forrst.com/api/v2/users/info?username=' + value, function(data) {
      var username = data.resp.username;
      var followers = data.resp.followers;

      var details = {
        following: data.resp.following,
        posts: data.resp.posts,
        likes: data.resp.likes,
        comments: data.resp.comments
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  },

  /**
   * Soundcloud API connection
   */
  soundcloud: function($this, value, site) {
    $.getJSON('http://api.soundcloud.com/users/' + value + '.json?client_id=6ff9d7c484c5e5d5517d1965ca18eca9', function(data) {
      var username = data.permalink;
      var followers = data.followers_count;

      var details = {
        following: data.followings_count,
        tracks: data.track_count,
        playlist: data.playlist_count,
        favorites: data.public_favorites_count
      };

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers, details);
        } else if ( $this === 'upgrade' ) {
          api.upgrade($this, site, followers, details);
        } else {
          api.success($this, site, username, followers, details);
        }
      } else {
        api.fail($this, api.errorApi);
      }
    })
    .fail(function() {
      api.fail($this, value + api.errorUsername);
    });
  }
};
