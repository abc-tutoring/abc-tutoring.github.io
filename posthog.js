(function initializeAnalytics() {
  'use strict';

  var config = window.ABC_CONFIG || {};

  function getTrafficSource() {
    var params = new URLSearchParams(window.location.search);
    var campaignSource = params.get('utm_source');
    if (campaignSource) return campaignSource.toLowerCase();

    if (document.referrer) {
      try {
        var referrerHost = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (referrerHost.includes('facebook.com') || referrerHost.includes('fb.com')) return 'facebook';
        return referrerHost;
      } catch (error) {
        return 'referral';
      }
    }

    return 'direct';
  }

  window.abcTrafficSource = getTrafficSource();
  window.abcTrack = function trackBeforeConfigured(eventName, properties) {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(eventName, properties || {});
    }
  };

  if (!config.posthogKey || !config.posthogKey.startsWith('phc_')) {
    console.info('PostHog is not configured. Add the public project key in config.js.');
    return;
  }

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],u.toString=function(t){var e='posthog';return'posthog'!==a&&(e+='.'+a),t||(e+=' (stub)'),e},u.people.toString=function(){return u.toString(1)+'.people (stub)'},o='init capture register register_once unregister get_distinct_id reset opt_in_capturing opt_out_capturing has_opted_out_capturing'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init(config.posthogKey, {
    api_host: config.posthogHost || 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    autocapture: false,
    capture_pageview: true,
    disable_session_recording: true,
    person_profiles: 'identified_only',
    respect_dnt: true,
    loaded: function(posthog) {
      posthog.register_once({ initial_traffic_source: window.abcTrafficSource });
      posthog.capture('homepage_viewed', { traffic_source: window.abcTrafficSource });
    }
  });
})();
