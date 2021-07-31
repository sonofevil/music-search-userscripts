// ==UserScript==
// @name        Search Metal Archives entry on Bandcamp
// @namespace   https://github.com/sonofevil/musicbrainz-userscripts/
// @version     2021.1
// @description Add a button on Metal Archives release pages allowing to search the entry on Bandcamp
// @downloadURL https://raw.github.com/sonofevil/musicbrainz-userscripts/master/metalarchives_importer.user.js
// @update      https://raw.github.com/sonofevil/musicbrainz-userscripts/master/metalarchives_importer.user.js
// @include     http*://www.metal-archives.com/albums/*/*/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.js
// @require     lib/mbimport.js
// @require     lib/mbimportstyle.js
// @require     lib/logger.js
// @icon        https://raw.githubusercontent.com/sonofevil/musicbrainz-userscripts/master/assets/images/Musicbrainz_import_logo.png
// ==/UserScript==

// prevent JQuery conflicts, see http://wiki.greasespot.net/@grant
this.$ = this.jQuery = jQuery.noConflict(true);

$(document).ready(function () {
    MBImportStyle();

    let release_url = window.location.href.replace('/?.*$/', '').replace(/#.*$/, '');
    let release = retrieveReleaseInfo(release_url);
    insertLink(release, release_url);
    LOGGER.info('Parsed release: ', release);
});

function setreleasedate(release, datestring) {
    if (/^\d{4}$/.exec(datestring)) {
        release.year = datestring;
    } else if (datestring.indexOf(',') != -1) {
        let commaindex = datestring.indexOf(',');
        var d = new Date(datestring.substring(0, commaindex - 2) + datestring.substring(commaindex));
        release.year = d.getFullYear();
    } else {
        var d = new Date(`2 ${datestring}`);
        release.year = d.getFullYear();
    }
    return release;
}

function getGenericalData() {
    let rdata = new Array();
    let keydata = $('dl.float_left dt, dl.float_right dt')
        .map(function () {
            let s = $.trim($(this).text());
            return s.substring(0, s.length - 1);
        })
        .get();
    let valuedata = $('dl.float_left dd,dl.float_right dd')
        .map(function () {
            return $.trim($(this).text());
        })
        .get();
    for (i = 0; i < keydata.length; i++) {
        rdata[keydata[i]] = valuedata[i];
    }
    return rdata;
}

function getArtistsList() {
    return $.map($('h2.band_name').text().split('/'), $.trim);
}

function retrieveReleaseInfo(release_url) {
    let release = {
        discs: [],
        artist_credit: [],
        title: '',
        year: 0,
        month: 0,
        day: 0,
        parent_album_url: '',
        labels: [],
        format: '',
        country: '',
        type: '',
        status: 'official',
        packaging: '',
        language: '',
        script: '',
        urls: [],
    };

    let rdata = getGenericalData();
    
    let artists = getArtistsList();
    
    let joinphrase = '';
    
    if (artists.length > 1) {
        if (rdata['Type'] == 'Split') {
            joinphrase = ' / ';
        } else {
            joinphrase = ' & ';
        }
    }
    
    for (let i = 0; i < artists.length; i++) {
        release.artist_credit.push({
            artist_name: artists[i],
            credited_name: artists[i],
            joinphrase: i != artists.length - 1 ? joinphrase : '',
        });
    }
    
    release.title = $('h1.album_name').text();

    release = setreleasedate(release, rdata['Release date']);
    
    return release;
}

// Insert button into page under label information
function insertLink(release, release_url) {
    let parameters = MBImport.buildFormParameters(release, '');
    
    let mbUI = $(`<div id="musicbrainz-import">${MBImport.buildSearchButton(release)}</div>`).hide();

    $('h2.band_name').after(mbUI);
    $('#musicbrainz-import form').css({
        padding: '0',
    });
    $('form.musicbrainz_import').css({
        display: 'inline-block',
        margin: '1px',
    });
    $('form.musicbrainz_import img').css({
        display: 'inline-block',
    });

    mbUI.slideDown();
}
