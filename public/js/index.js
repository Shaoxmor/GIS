new WOW().init();
$(document).ready(function () {
  $('#news-slider').owlCarousel({
    items: 3,
    itemsDesktop: [1199, 2],
    itemsDesktopSmall: [980, 2],
    itemsMobile: [600, 1],
    pagination: false,
    navigationText: false,
    autoPlay: true
  })
})