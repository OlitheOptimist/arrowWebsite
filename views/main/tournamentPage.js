var $sidebar   = $("#sidebar"), 
    $window    = $(window),
    offset     = $sidebar.offset(),
    topPadding = 15;

$window.scroll(function() {
    if ($window.scrollTop() > offset.top) {
        $sidebar.css({marginTop: $window.scrollTop() - offset.top + topPadding});
    } else {
        $sidebar.css({marginTop: 0});
    }
});