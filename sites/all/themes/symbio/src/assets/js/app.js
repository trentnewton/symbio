(function ($) {

  'use strict';

  $(window).bind('load', function () {

    // initiate foundation

    $(document).foundation();

    // hamburger icon animation

    $('#offCanvas').bind('opened.zf.offcanvas closed.zf.offcanvas', function () {
      $('.menu-icon').toggleClass('rotate');
    });

  });

  // clip-path polyfill for 'brands' page

  function clippathPolyfill() {
    var evenPoints = [[5, 100], [5, 60], [0, 50], [5, 40], [5, 0], [100, 0], [100, 100]];
    var oddPoints = [[95, 60], [95, 100], [0, 100], [0, 0], [95, 0], [95, 40], [100, 50]];
    var smallPoints = [[100, 95], [60, 95], [50, 100], [40, 95], [0, 95], [0, 0], [100, 0]];
    var current_width = $(window).width();
    if(current_width < 640){
      $('.views-row-odd .text').clipPath(smallPoints, {
        isPercentage: true,
        svgDefId: 'smalloddSvg'
      });
      $('.views-row-even .text').clipPath(smallPoints, {
        isPercentage: true,
        svgDefId: 'smallevenSvg'
      });
    } else {
      $('.views-row-odd .text').clipPath(oddPoints, {
        isPercentage: true,
        svgDefId: 'oddSvg'
      });
      $('.views-row-even .text').clipPath(evenPoints, {
        isPercentage: true,
        svgDefId: 'evenSvg'
      });
    }
  }

  $(document).ready(clippathPolyfill);

  $(window).resize(clippathPolyfill);

  $(document).ready(function(){

    // add classes to split columns on product ranges page

    $('.views-row-even .text').addClass('medium-push-4 large-push-6');
    $('.views-row-even .logo').addClass('medium-pull-8 large-pull-6');

    // wrap li's around links in mobile navigation

    $('.off-canvas-list>a').wrap('<li />');

    // wrap a's around current pagination numbers

    $('li.pager-current, li.pager-ellipsis').wrapInner('<a />');

    // unwrap ul from mobile navigation

    $('.off-canvas-list ul#main-menu-links>li').unwrap();

    // add block grid class to site map list

    $('.site-map-box-menu>.content>ul.site-map-menu').addClass('row small-up-2 medium-up-3');

    // add column to li on block grid on site map page

    $('.site-map-box-menu>.content>ul.site-map-menu>li').addClass('column');

    // add h4 tags to page titles on site map page

    $('.site-map-box-menu>.content>ul.site-map-menu>li>a').wrap('<h4 />');

    // add svg icon to download link

    $('<svg class="icon icon-download"><use xlink:href="#icon-download"></use></svg>').prependTo('.major-header>.catalogue-link>li>a');

    // wrap tables with overflow auto

    $('table').wrap('<div class="overflow-auto" />');

  });

  // hide maps overlay when clicked

  $('.google-maps-overlay').on('click', function () {
    $(this).toggleClass('hide');
    return false;
  });

  // change to 4 item block grid when logged in for product data sheets

  $('.logged-in .view-product-data-sheets-main ul.medium-up-3').addClass('medium-up-4').removeClass('medium-up-3');

  // collapsing fieldset

  $('.fieldset-title').on('click', function () {
    $('.search-advanced').toggleClass('collapsing');
    $('.fieldset-wrapper').toggle(function () {
      $(this).animate({height: '16px'}, 1000);
    }, function () {
        $(this).animate({height: 'auto'}, 1000);
    });
    $('.fieldset-wrapper>.criterion, .fieldset-wrapper>.action').fadeToggle(500);
    $('.fieldset-legend-arrow').toggleClass('rotated');
    return false;
  });

  // scroll to sections

  $('a[href*=\\#]:not([href=\\#])').click(function () {
    if (location.pathname.replace(/^\//,'') === this.pathname.replace(/^\//,'') && location.hostname === this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });

  // Drupal ajax (useful for captcha on forms)

  Drupal.behaviors.recapcha_ajax_behaviour = {
    attach: function (context, settings) {
      if (typeof grecaptcha != "undefined") {
        var captchas = document.getElementsByClassName('g-recaptcha');
        for (var i = 0; i < captchas.length; i++) {
          var site_key = captchas[i].getAttribute('data-sitekey');
          if (!$(captchas[i]).html()) {
            grecaptcha.render(captchas[i], {'sitekey' : site_key});
          }
        }
      }
    }
  }

})(jQuery);

// animation settings

var enterLeft = {
  origin: 'left',
  distance : '50px',
};

var enterRight = {
  origin: 'right',
  distance : '50px',
};

var enterLeft1 = {
  delay: 1000,
  origin: 'left',
  distance : '50px',
};

var enterRight1 = {
  delay: 1000,
  origin: 'right',
  distance : '50px',
};

window.sr = ScrollReveal()
  .reveal('.enter-bottom')
  .reveal('.enter-bottom-1', {delay: 500})
  .reveal('.enter-bottom-2', {delay: 1000})
  .reveal('.enter-bottom-3', {delay: 1500})
  .reveal('.enter-bottom-4', {delay: 2000})
  .reveal('.enter-left', enterLeft)
  .reveal('.enter-right', enterRight)
  .reveal('.enter-left-1', enterLeft1)
  .reveal('.enter-right-1', enterRight1);