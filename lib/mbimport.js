///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                          Bandcamp Search Helper Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * How to use this module?
 *
 * - First build a release object (see expected format below) that you'll fill in from source of data
 * - Call as follows, e.g.:
 *     var parameters = MBImport.buildFormParameters(parsedRelease, optionalEditNote);
 * - Inject the search link:
 *     var linkHtml = MBImport.buildSearchLink(parsedRelease);
 *
 * Expected format of release object:
 *
 *     release = {
 *         title,
 *         artist_credit,
 *         year,
 *     }
 *
 *     where 'artist_credit' has the following format:
 *
 *     artist_credit = [
 *         {
 *             credited_name,
 *             artist_name,
 *             artist_mbid,
 *             joinphrase
 *         },
 *         ...
 *     ]
 *
 */

var MBImport = (function () {
    // --------------------------------------- publics ----------------------------------------- //

    // compute HTML of search button
    function fnBuildSearchButton(release) {
        let parameters = searchParams(release);
        let html = `<form class="musicbrainz_import musicbrainz_import_search" action="//google.com/search" method="get" target="_blank" accept-charset="UTF-8" charset="${document.characterSet}">`;
        parameters.forEach(function (parameter) {
            let value = `${parameter.value}`;
            html += `<input type='hidden' value='${value.replace(/'/g, '&apos;')}' name='${parameter.name}'/>`;
        });
        html += '<button type="submit" title="Search for this release on Bandcamp (open a new tab)"><span>Search on Bandcamp</span></button>';
        html += '</form>';
        return html;
    }

    // build form POST parameters that MB is waiting
    function fnBuildFormParameters(release, edit_note) {
        // Form parameters
        let parameters = new Array();
        appendParameter(parameters, 'name', release.title);

        // Release Artist credits
        buildArtistCreditsFormParameters(parameters, '', release.artist_credit);

        /*if (release['secondary_types']) {
            for (let i = 0; i < release.secondary_types.length; i++) {
                appendParameter(parameters, 'type', release.secondary_types[i]);
            }
        }*/
        
        if (!isNaN(release.year) && release.year != 0) {
            appendParameter(parameters, 'date.year', release.year);
        }

        return parameters;
    }

    // --------------------------------------- privates ----------------------------------------- //

    function appendParameter(parameters, paramName, paramValue) {
        if (!paramValue) return;
        parameters.push({ name: paramName, value: paramValue });
    }

    function luceneEscape(text) {
        let newtext = text.replace(/[-[\]{}()*+?~:\\^!"\/]/g, '\\$&');
        return newtext.replace('&&', '&&').replace('||', '||');
    }

    function buildArtistCreditsFormParameters(parameters, paramPrefix, artist_credit) {
        if (!artist_credit) return;
        for (let i = 0; i < artist_credit.length; i++) {
            let ac = artist_credit[i];
            appendParameter(parameters, `${paramPrefix}artist_credit.names.${i}.name`, ac.credited_name);
            appendParameter(parameters, `${paramPrefix}artist_credit.names.${i}.artist.name`, ac.artist_name);
            appendParameter(parameters, `${paramPrefix}artist_credit.names.${i}.mbid`, ac.mbid);
            if (typeof ac.joinphrase != 'undefined' && ac.joinphrase != '') {
                appendParameter(parameters, `${paramPrefix}artist_credit.names.${i}.join_phrase`, ac.joinphrase);
            }
        }
    }

    function searchParams(release) {
        let params = [];

        //const totaltracks = release.discs.reduce((acc, { tracks }) => acc + tracks.length, 0);
        let release_artist = '';
        for (let i = 0; i < release.artist_credit.length; i++) {
            let ac = release.artist_credit[i];
            release_artist += ac.artist_name;
            if (typeof ac.joinphrase != 'undefined' && ac.joinphrase != '') {
                release_artist += ac.joinphrase;
            } else {
                if (i != release.artist_credit.length - 1) release_artist += ', ';
            }
        }

        let query =
            'site:bandcamp.com' +
            ' "' + `${luceneEscape(release_artist)}` + '"' +
            ' "' + `${luceneEscape(release.title)}` + '"' +
            ` ${release.year}`;

            //second value is parameter name as it appears in url. see also fnSearchUrlFor
        appendParameter(params, 'q', query, 'btnI');
        return params;
    }

    // ---------------------------------- expose publics here ------------------------------------ //

    return {
        buildSearchButton: fnBuildSearchButton,
        buildFormParameters: fnBuildFormParameters,
    };
})();
