/* hashtrack.js
   Provides mechanism to poll URL hash changes, parse like a querystring,
   and hook into value changes.
 */

if (typeof $ == "undefined") {
    var $ = {};
    // This is the only part of jQuery used, so if you don't have it, we'll include it!
    $.each = function( object, callback, args ) {
	var name, i = 0, length = object.length;
	if ( args ) {
	    if ( length == undefined ) {
		for ( name in object )
		    if ( callback.apply( object[ name ], args ) === false )
			break;
	    } else
		for ( ; i < length; )
		    if ( callback.apply( object[ i++ ], args ) === false )
			break;

	    // A special, fast, case for the most common use of each
	} else {
	    if ( length == undefined ) {
		for ( name in object )
		    if ( callback.call( object[ name ], name, object[ name ] ) === false )
			break;
	    } else
		for ( var value = object[0];
		      i < length && callback.call( value, i, value ) !== false; value = object[++i] ){}
	}

	return object;
    };
}

var hashtrack = {
    'frequency': 100,
    'last_hash': location.hash,
    'onhashchange_callbacks': [],
    'onhashvarchange_callbacks': {},
    'first_call': [],
    'interval': null,

    'check_hash': function() {
	if (location.hash != hashtrack.last_hash)
	{
	    hashtrack.last_hash = location.hash;
	    hashtrack.updateVars();
	    hashtrack.call_onhashchange_callbacks();
	}
    },
    'init': function() {
	if (hashtrack.interval === null) {
	    hashtrack.interval = setInterval(hashtrack.check_hash,
					     hashtrack.frequency);
	}
	if (typeof hashtrack.vars == "undefined") {
	    hashtrack.vars = {};
	}
	hashtrack.updateVars();
	// Act on the hash as if it changed when the page loads, if its
	// "important"
	if (location.hash) {
	    hashtrack.call_onhashchange_callbacks();
        }
    },
    'setFrequency': function (freq) {
	if (hashtrack.frequency != freq) {
	    hashtrack.frequency = freq;
	    if (hashtrack.interval) {
		clearInterval(hashtrack.interval);
		hashtrack.interval = setInterval(hashtrack.check_hash, hashtrack.frequency);
	    }
	}
    },
    'stop': function() {
	clearInterval(hashtrack.interval);
	hashtrack.interval = null;
    },
    'onhashchange': function(func, first_call) {
        hashtrack.onhashchange_callbacks.push(func);
	if (first_call) {
	    func(location.hash.slice(1));
	}
    },
    'onhashvarchange': function(varname, func, first_call) {
	if (!(varname in hashtrack.onhashvarchange_callbacks)) {
	    hashtrack.onhashvarchange_callbacks[varname] = [];
	}
	hashtrack.onhashvarchange_callbacks[varname].push(func);
	if (first_call) {
	    func(hashtrack.getVar(varname));
	}
    },
    'call_onhashchange_callbacks': function() {
        var hash = location.hash.slice(1);
        $.each(hashtrack.onhashchange_callbacks, function() {
            this(hash);
        });
    },
    'call_onhashvarchange_callbacks': function(name, value) {
	if (name in hashtrack.onhashvarchange_callbacks) {
	    $.each(hashtrack.onhashvarchange_callbacks[name], function() {
		this(value);
	    });
	}
    },

    'updateVars': function () {
	var vars = hashtrack.getAllVars();
	$.each(vars, function (name, value) {
		if (hashtrack.vars[name] != value) {
		    hashtrack.call_onhashvarchange_callbacks(name, value);
		}
	    });
	hashtrack.vars = vars;
    },
    'getAllVars': function () {
	var hash = window.location.hash.slice(1, window.location.hash.length);
	var vars = hash.split("&");
	var result_vars = {};
	for (var i=0;i<vars.length;i++) {
	    var pair = vars[i].split("=");
	    result_vars[pair[0]] = pair[1];
	}
	return result_vars;
    },
    'getVar': function (variable) {
	return hashtrack.vars[variable];
    },

    'setVar': function (variable, value) {
	var hash = window.location.hash.slice(1, window.location.hash.length);
	var new_hash;
	if (hash.indexOf(variable + '=') == -1) {
	    new_hash = hash + '&' + variable + '=' + value;
	} else {
	    new_hash = hash.replace(variable + '=' + hashtrack.getVar(variable), variable + '=' + value);
	}
	window.location.hash = new_hash;
	hashtrack.vars[variable] = value;
    }
};

if (typeof $ != "undefined") {
    $(document).ready(hashtrack.init);
}