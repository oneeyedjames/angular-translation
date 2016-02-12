angular.module('angular.plugins.translation', [])

.provider('$translation', function() {
    var defaultLocale;
    var translations = {};

    this.defaultLocale = function(locale) {
        if (locale) {
            defaultLocale = locale;
            return this;
        } else {
            return defaultLocale;
        }
    };

    this.translations = function(locale, dictionary) {
        if (typeof dictionary == 'object') {
            translations[locale] = dictionary;
        } else if (typeof dictionary == 'string') {
            var xhr = new XMLHttpRequest();

    		xhr.onreadystatechange = function() {
    			if (xhr.readyState == XMLHttpRequest.DONE) {
    				if (xhr.status == 200)
    					translations[locale] = angular.fromJson(xhr.responseText);
    				else
    					console.warn('Unable to load url "' + dictionary + '" for locale "' + locale + '"');
    			}
    		};

    		xhr.open('GET', dictionary);
    		xhr.send();
        }

        return this;
    };

    this.$get = ['$rootScope', '$log', function($rootScope, $log) {
        var currentLocale = defaultLocale;

        var resolveLocale = function(locale) {
            var locales = Object.keys(translations);

            if (locales.indexOf(locale) >= 0)
                return locale;

            var parts = [];

            if (locale.indexOf('-') > 0)
                parts = locale.split('-');
            else if (locale.indexOf('_') > 0)
                parts = locale.split('_');

            if (parts.length) {
                if (locales.indexOf(parts[0]) >= 0) {
                    $log.info("Resolving locale '" + locale + "' to '" + parts[0] + "'");
                    return parts[0];
                }
            }

            return false;
        };

        return {
            locale: function(locale) {
                if (locale) {
                    currentLocale = locale;
                    $rootScope.$broadcast('translation.setlocale', locale);
                    return this;
                } else {
                    return currentLocale;
                }
            },

            allLocales: function() {
                return Object.keys(translations);
            },

            translate: function(phrase, locale) {
                locale = resolveLocale(locale || currentLocale);

                if (!locale || !translations[locale]) {
                    $log.warn("No translation for locale '" + locale + "'");
                    return phrase;
                }

                if (!translations[locale][phrase]) {
                    $log.warn("No translation for phrase '" + phrase + "' in locale '" + locale + "'");
                    return phrase;
                }

                return translations[locale][phrase];
            }
        };
    }];
})

.filter('translate', ['$translation', function($translation) {
    return function(phrase, locale) {
        return $translation.translate(phrase, locale);
    };
}]);
