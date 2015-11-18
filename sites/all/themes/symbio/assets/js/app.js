$(document).foundation();

// wrap li's around links in mobile navigation

$('.off-canvas-list>a').wrap('<li />');

// wrap a's around current pagination numbers

$('li.pager-current').wrapInner('<a />');

// unwrap ul from mobile navigation

$('.off-canvas-list ul#main-menu-links>li').unwrap();

// add block grid class to site map list

$(".site-map-box-menu>.content>ul.site-map-menu").addClass( "small-block-grid-2" );

// add h4 tags to page titles on sitemap pages

$('.site-map-box-menu>.content>ul.site-map-menu>li>a').wrap('<h4 />');

// change input type to search

$('.form-type-textfield').find('input:text').attr({type:"search"});

// animations

$(document).ready(function() {
  // scrollreveal plugin!
  var config = {
    reset: false,
    vFactor: 0.1, // requires 10% of an element be visible to trigger animation.
    // viewport: document.getElementsByClassName('animate'),
    // viewport: document.getElementsByTagName('p'),
    mobile: true
  };
  window.sr = new scrollReveal( config );
});

// scroll to sections

$(function() {
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
});

document.addEventListener("touchstart", function(){}, true);