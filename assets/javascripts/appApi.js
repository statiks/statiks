/**
 * API namespace with related methods
 * Success, fail, reload and API connects
 * @global
 */
var api = {
  /**
   * Success fallback when retrieve data
   */
  success: function($this, site, username, followers) {
    var success = $('<span class="icon-check"></span>');

    $this.find('input').blur();
    $this.find('.icon-error, .icon-clear').remove();

    /*
    * Display the check icon during a short time
    * Not add it on the DOM again, if is already append
    */
    if ( !$this.find('.icon-check').length ) {
      $this.append(success);

      setTimeout(function() {
        $this.find('.icon-check').remove();
      }, 1500);
    }

    /*
    * Check if localstorage exist
    * Push data to object and store it
    */
    if (localStorage !== null) {
      dataArray[site] = {
        username: username,
        followers: followers
      };

      localStorage.setItem('user-data', JSON.stringify(dataArray));
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
      $this.find('.icon-check, .icon-clear').remove();

      if ( !$this.find('.icon-error').length ) {
        $this.append(error);

        setTimeout(function() {
          $this.find('.icon-error').remove();
        }, 1500);
      }
    }

    /*
    * Display alert when an error occured
    */
    if (alert) {
      // Not add it on the DOM again, if is already append
      if ( !$('.alert').length ) {
        var alert = '<div class="alert"><p></p></div>';
        $(alert).insertAfter('header');
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
  reload: function($this, site, followers) {
    var dataDiff = {};

    /*
     * Only excute if followers numbers are differents.
     */
    if ( dataArray[site].followers !== followers ) {
      var diff = followers - dataArray[site].followers;
      var socialItem = $('.list-social').find('.' + site + ' .right');
      var totalItem = $('.total').find('.right');

      dataDiff[site] = {
        diff: diff
      };

      // Update value of object
      dataArray[site].followers = followers;

      // Push to localstorage
      localStorage.setItem('user-data', JSON.stringify(dataArray));
      localStorage.setItem('user-diff', JSON.stringify(dataDiff));

      // Render new data for each networks
      socialItem.find('.nbr').text(followers);
      socialItem.find('p span').text((diff > 0 ? '+' : '') + diff);

      var totalFollowers = 0;
      var totalDiff = 0;

      Object.keys(dataArray).forEach(function(site) {
        totalFollowers += parseInt(dataArray[site].followers);
      });

      Object.keys(dataDiff).forEach(function(site) {
        totalDiff += parseInt(dataDiff[site].diff);
      });

      totalItem.find('.nbr').text(totalFollowers);
      if ( dataDiff !== null ) totalItem.find('p span').text((totalDiff > 0 ? '+' : '') + totalDiff);

    } else {
      // TO FIX
      $(document).ajaxStop(function() {
        api.fail(null, 'Nothing new :(');
      });
    }
  },

  /**
   * Dribbble API connection
   */
  dribbble: function($this, value, site) {
    $.getJSON('http://api.dribbble.com/' + value, function(data) {
      var username = data.username;
      var followers = data.followers_count;

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      } else {
        var errorCustomMessage = 'Data from API are incorrect.';
        api.fail($this, errorCustomMessage);
      }
    })
    .fail(function(response) {
      api.fail($this, response.responseJSON.message[1]);
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

        var regex = /\"followers_count\":([^\,]+)/;
        var getFollowers = data.match(regex);

        var username = value;
        var followers = getFollowers[1];

        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      }
    })
    .fail(function() {
      var errorCustomMessage = 'Invalid username.';
      api.fail($this, errorCustomMessage);
    });
  },

  /**
   * Behance API connection
   */
  behance: function($this, value, site) {
    $.getJSON('https://www.behance.net/v2/users/' + value + '?api_key=pEb2TjTxS31kT7fv2TPma6WK8WF8Mlgf', function(data) {
      var username = data.user.username;
      var followers = data.user.stats.followers;

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      } else {
        var errorCustomMessage = 'Data from API are incorrect.';
        api.fail($this, errorCustomMessage);
      }
    })
    .fail(function(response) {
      api.fail($this, response.responseJSON.http_code);
    });
  },

  /**
   * 500px API connection
   */
  cinqcentpx: function($this, value, site) {
    $.getJSON('https://api.500px.com/v1/users/show?username=' + value + '&consumer_key=GKHCkl4MdEE2rCFLVeIOWbYxhgk06s69xKnUzad3', function(data) {
      var username = data.user.username;
      var followers = data.user.followers_count;

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      } else {
        var errorCustomMessage = 'Data from API are incorrect.';
        api.fail($this, errorCustomMessage);
      }
    })
    .fail(function(response) {
      api.fail($this, response.responseJSON.error);
    });
  },

  /**
   * GitHub API connection
   */
  github: function($this, value, site) {
    $.getJSON('https://api.github.com/users/' + value, function(data) {
      var username = data.login;
      var followers = data.followers;

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      } else {
        var errorCustomMessage = 'Data from API are incorrect.';
        api.fail($this, errorCustomMessage);
      }
    })
    .fail(function(response) {
      api.fail($this, response.responseJSON.message);
    });
  },

  /**
   * Vimeo API connection
   */
  vimeo: function($this, value, site) {
    $.getJSON('http://vimeo.com/api/v2/' + value + '/info.json', function(data) {
      var username = value;
      var followers = data.total_contacts;

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      } else {
        var errorCustomMessage = 'Data from API are incorrect.';
        api.fail($this, errorCustomMessage);
      }
    })
    .fail(function(response) {
      api.fail($this, response.responseText);
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

        var regex = /\"followed_by\":([^\,]+)/g;
        var getFollowers = data.match(regex);

        var username = value;
        var followers = getFollowers[1].substr(getFollowers[1].indexOf(':') + 1);

        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      }
    })
    .fail(function() {
      var errorCustomMessage = 'Invalid username.';
      api.fail($this, errorCustomMessage);
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

        var regex = /\"follower_count\":([^\,]+)/g;
        var getFollowers = data.match(regex);

        var username = value;
        var followers = getFollowers[1].substr(getFollowers[1].indexOf(' ') + 1);

        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      }
    })
    .fail(function() {
      var errorCustomMessage = 'Invalid username.';
      api.fail($this, errorCustomMessage);
    });
  },

  /**
   * Youtube API connection
   */
  youtube: function($this, value, site) {
    $.getJSON('https://gdata.youtube.com/feeds/api/users/' + value + '?v=2&alt=json', function(data) {
      var username = data.entry.yt$username.$t;
      var followers = data.entry.yt$statistics.subscriberCount;

      if ( username !== undefined && followers !== undefined ) {
        if ( $this === 'reload' ) {
          api.reload($this, site, followers);
        } else {
          api.success($this, site, username, followers);
        }
      } else {
        var errorCustomMessage = 'Data from API are incorrect.';
        api.fail($this, errorCustomMessage);
      }
    })
    .fail(function(response) {
      api.fail($this, response.statusText);
    });
  }
};