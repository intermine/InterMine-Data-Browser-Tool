$.fn.strech_text = function(){
    var elmt          = $(this),
        cont_width    = elmt.width(),
        txt           = elmt.html(),
        one_line      = $('<span class="stretch_it">' + txt + '</span>'),
        nb_char       = elmt.text().length,
        spacing       = cont_width/nb_char,
        txt_width;
    
    elmt.html(one_line);
    txt_width = one_line.width();
    
    if (txt_width < cont_width){
        var  char_width     = txt_width/nb_char,
             ltr_spacing    = spacing - char_width + (spacing - char_width)/nb_char ; 
  
        one_line.css({'letter-spacing': ltr_spacing});
    } else {
        one_line.contents().unwrap();
        elmt.addClass('justify');
    }
};

 	function getColorsArray(size) {
		var rainbow = [
    "#fbb735", "#e98931", "#eb403b", "#b32E37", "#6c2a6a",
    "#5c4399", "#274389", "#1f5ea8", "#227FB0", "#2ab0c5",
    "#39c0b3",'#b3cae5', '#dbdde4', '#e4e3e4', '#f7ddbb', '#efcab2',
'#bccacc', '#c7d8d6', '#d9ebe0', '#ebf9e3', '#f4f8d0',
'#5e7fb1', '#dce8f7', '#eff1f4', '#fce1a8', '#f7ec86',
'#8fb8ee', '#cbe2f4', '#dbe5eb', '#f9d3b8', '#e0b2a3',
'#a2e0f9', '#cef5fc', '#eafaeb', '#fefcd3', '#fdf4ba',
'#6bafd2', '#a4c8dc', '#d6cbca', '#eabc96', '#db8876',
'#b4ced8', '#d7e5d4', '#e2e8c9', '#f1e5b9', '#edd7ac',
'#29153e', '#657489', '#bfb6aa', '#ead79d', '#f2ebda',
'#20202f', '#273550', '#416081', '#adacb2', '#eac3a2',
'#555351', '#555351', '#8d7b6c', '#cc9d7a', '#fff9aa',
'#171c33', '#525f83', '#848896', '#bb9d78', '#f6e183',
'#ffe3c8', '#efad9e', '#c79797', '#a78a92', '#857d8d',
'#6f749e', '#9a8daf', '#d0a8b9', '#f8bbb1', '#fde6b1',
'#536a97', '#8087ad', '#bca391', '#bd968a', '#a38b8a',
'#325176', '#7b9ea7', '#9baf93', '#dbaf81', '#fbdf73',
'#727288', '#8e889b', '#d3c2bd', '#f9d89a', '#f8c785',
'#506e90', '#7695aa', '#a7bdb8', '#e2e2b8', '#fdf998',
'#634b5f', '#868080', '#b7b29b', '#dfd6a4', '#e9f3a2',
'#7e74b2', '#b3a2c2', '#e2cdbe', '#f6cf97', '#f4a77a',
'#34a4ca', '#59d7dd', '#a8f2f0', '#d0f8ef', '#d6f6e1',
'#7696cd', '#8fb2e4', '#b0cff0', '#d7e5ec', '#dee0e7',
'#8dd6c3', '#c5e5e2', '#eafaeb', '#f9f7ca', '#fceea1',
'#4e72c7', '#6d9ed7', '#a4c8d5', '#b4d9e1', '#c4d9d6',
'#47565f', '#5b625a', '#947461', '#f98056', '#f7ec86',
'#95b3bf', '#c6cdd3', '#e5d8d9', '#f1e1d9', '#f3e1cd',
'#4c86ab', '#95a5bc', '#bfcdc9', '#dcd6c9', '#edd9c7',
'#0f124a', '#1b2360', '#515b80', '#758391', '#e5e3b0',
'#889db6', '#a5b8ce', '#c1cfdd', '#dee1e4', '#d5d1cf',
'#74bddb', '#a8d1eb', '#cddbf5', '#e4e6fb', '#f6f4f8',
'#a7d3cb', '#bcc1c4', '#e5cab3', '#fee6c5', '#fdecd0',
'#325571', '#8e9fa4', '#decab2', '#f2d580', '#ffa642',
'#c5d4d7', '#d6b98d', '#c99262', '#8c5962', '#43577e'
];

		return rainbow;
	};

(function($) {
  "use strict"; // Start of use strict
  // Configure tooltips for collapsed side navigation
  $('.navbar-sidenav [data-toggle="tooltip"]').tooltip({
    template: '<div class="tooltip navbar-sidenav-tooltip" role="tooltip" style="pointer-events: none;"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
  })
  // Toggle the side navigation
  $("#sidenavToggler").click(function(e) {
    e.preventDefault();
    $("body").toggleClass("sidenav-toggled");
    $(".navbar-sidenav .nav-link-collapse").addClass("collapsed");
    $(".navbar-sidenav .sidenav-second-level, .navbar-sidenav .sidenav-third-level").removeClass("show");
  });
  // Force the toggled class to be removed when a collapsible nav link is clicked
  $(".navbar-sidenav .nav-link-collapse").click(function(e) {
    e.preventDefault();
    $("body").removeClass("sidenav-toggled");
  });
  // Prevent the content wrapper from scrolling when the fixed side navigation hovered over
  $('body.fixed-nav .navbar-sidenav, body.fixed-nav .sidenav-toggler, body.fixed-nav .navbar-collapse').on('mousewheel DOMMouseScroll', function(e) {
    var e0 = e.originalEvent,
      delta = e0.wheelDelta || -e0.detail;
    this.scrollTop += (delta < 0 ? 1 : -1) * 30;
    e.preventDefault();
  });
  // Scroll to top button appear
  $(document).scroll(function() {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  });
  // Configure tooltips globally
  $('[data-toggle="tooltip"]').tooltip()
  // Smooth scrolling using jQuery easing
  $(document).on('click', 'a.scroll-to-top', function(event) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: ($($anchor.attr('href')).offset().top)
    }, 1000, 'easeInOutExpo');
    event.preventDefault();
  });
  
  // Fetch number of genes
  var service = new imjs.Service({
         root: 'http://www.humanmine.org/humanmine/service'
  });
  
  var query = {
    "from": "Gene",
    "select": ["primaryIdentifier"]
  };
  
  service.count(query).then(function(response) {
    //console.log(response)
	$("#genesCardText").text(response + " Genes");
  });
  
  // Fetch number of proteins
  var service = new imjs.Service({
         root: 'http://www.humanmine.org/humanmine/service'
  });
  
  var query = {
    "from": "Protein",
    "select": ["primaryIdentifier"]
  };
  
  service.count(query).then(function(response) {
    //console.log(response)
	$("#proteinsCardText").text(response + " Proteins");
  });
  //
  
  $(document).ready(function () {
    $('.stretch').each(function(){
        $(this).strech_text();
    });
});
  
  
})(jQuery); // End of use strict
