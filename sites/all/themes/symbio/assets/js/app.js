(function($) {

  "use strict";

  $(document).foundation();

  // wrap li's around links in mobile navigation

  $('.off-canvas-list>a').wrap('<li />');

  // wrap a's around current pagination numbers

  $('li.pager-current').wrapInner('<a />');

  // unwrap ul from mobile navigation

  $('.off-canvas-list ul#main-menu-links>li').unwrap();

  // add block grid class to site map list

  $(".site-map-box-menu>.content>ul.site-map-menu").addClass( "row small-up-2 medium-up-3" );

  // add h4 tags to page titles on sitemap pages

  $('.site-map-box-menu>.content>ul.site-map-menu>li>a').wrap('<h4 />');

  // change input type to search

  $('.form-item-search-block-form').find('input:text').attr({type:"search"});
  $('.form-item-custom-search-blocks-form-1').find('input:text').attr({type:"search"});
  $('.form-item-custom-search-blocks-form-2').find('input:text').attr({type:"search"});
  $('.form-item-keys').find('input:text').attr({type:"search"});

  // add svg icon to download link

  $('<svg class="icon icon-download"><use xlink:href="#icon-download"></use></svg>').prependTo('.major-header>.catalogue-link');

  // wrap tables with overflow auto

  $('table').wrap('<div class="overflow-auto" />');

  // hamburger icon animation

  $('.menu-icon').on('click', function() {
    $(this).toggleClass('rotate');
  });

  $('.js-off-canvas-exit').on('click', function() {
    $('.menu-icon').toggleClass('rotate');
  });

  // collapsing fieldset

  $('.search-advanced>legend>.fieldset-legend').wrap('<a class="fieldset-title" href="#show" />');
  $('<span class="fieldset-legend-arrow"></span>').insertBefore('.fieldset-legend');

  $('.fieldset-title').on('click', function() {
    $('.search-advanced').toggleClass('collapsing');
    $('.fieldset-wrapper').fadeToggle('fast', 'linear');
    $('.fieldset-legend-arrow').toggleClass('rotated');
  });

})(jQuery);

// animations

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
  .reveal( '.enter-bottom')
  .reveal( '.enter-bottom-1', { delay: 500 } )
  .reveal( '.enter-bottom-2', { delay: 1000 } )
  .reveal( '.enter-bottom-3', { delay: 1500 } )
  .reveal( '.enter-bottom-4', { delay: 2000 } )
  .reveal( '.enter-left', enterLeft )
  .reveal( '.enter-right', enterRight )
  .reveal( '.enter-left-1', enterLeft1 )
  .reveal( '.enter-right-1', enterRight1 );

// scroll to sections

(function($) {
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') === this.pathname.replace(/^\//,'') && location.hostname === this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
})(jQuery);

document.addEventListener("touchstart", function(){}, true);