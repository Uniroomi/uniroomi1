;(function($){
    "use strict"
    var nav_offset_top = $('.header_area').height()+50; 
    /*-------------------------------------------------------------------------------
	  Navbar 
	-------------------------------------------------------------------------------*/

	//* Navbar Fixed  
    function navbarFixed(){
        if ( $('.header_area').length ){ 
            $(window).scroll(function() {
                var scroll = $(window).scrollTop();   
                if (scroll >= nav_offset_top ) {
                    $(".header_area").addClass("navbar_fixed");
                } else {
                    $(".header_area").removeClass("navbar_fixed");
                }
            });
        };
    };
    navbarFixed();
    
    function testimonialSlider(){
        if ( $('.testimonial_slider').length ){
            $('.testimonial_slider').owlCarousel({
                loop:true,
                margin: 30,
                items: 2,
                nav:false,
                autoplay: true,
                dots: true,
                smartSpeed: 1500,
                responsiveClass: true,
                responsive: {
                    0: {
                        items: 1,
                    },
                    768: {
                        items: 2,
                    },
                }
            })
        }
    }
    testimonialSlider();
    
    //------- Mailchimp js --------//  

    function mailChimp(){
        $('#mc_embed_signup').find('form').ajaxChimp();
    }
    mailChimp();
    
    /* ===== Parallax Effect===== */
	
	function parallaxEffect() {
    	$('.bg-parallax').parallax();
	}
	parallaxEffect();
    
    
    // Initialize nice-select only for specific elements, not globally - DISABLED FOR DEBUGGING
    // $('select').niceSelect(); // Removed global initialization
    // DISABLE NICE-SELECT COMPLETELY TO USE REGULAR SELECTS
    console.log('Nice-select disabled - using regular selects');
    
    // Initialize datetimepicker only if elements exist and library is loaded
    if (typeof $.fn.datetimepicker !== 'undefined' && $('#datetimepicker11,#datetimepicker1').length) {
        $('#datetimepicker11,#datetimepicker1').datetimepicker({
            daysOfWeekDisabled: [0, 6]
        });
    }
    
     /*---------gallery isotope js-----------*/
    function galleryMasonry(){
        if ( $('#gallery').length ){
            $('#gallery').imagesLoaded( function() {
              // images have loaded
                // Activate isotope in container
                $("#gallery").isotope({
                    itemSelector: ".gallery_item",
                    layoutMode: 'masonry',
                    animationOptions: {
                        duration: 750,
                        easing: 'linear'
                    }
                });
            })
        }
    }
    galleryMasonry();
	
	/*----------------------------------------------------*/
    /*  Simple LightBox js
    /*----------------------------------------------------*/
    $('.imageGallery1 .light').simpleLightbox();
    
    /*----------------------------------------------------*/
    /*  Google map js
    /*----------------------------------------------------*/
    
    if ( $('#mapBox').length ){
        var $lat = $('#mapBox').data('lat');
        var $lon = $('#mapBox').data('lon');
        var $zoom = $('#mapBox').data('zoom');
        var $marker = $('#mapBox').data('marker');
        var $info = $('#mapBox').data('info');
        var $markerLat = $('#mapBox').data('mlat');
        var $markerLon = $('#mapBox').data('mlon');
        var map = new GMaps({
        el: '#mapBox',
        lat: $lat,
        lng: $lon,
        scrollwheel: false,
        scaleControl: true,
        streetViewControl: false,
        panControl: true,
        disableDoubleClickZoom: true,
        mapTypeControl: false,
        zoom: $zoom,
            styles: [
                {
                    "featureType": "water",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#dcdfe6"
                        }
                    ]
                },
                {
                    "featureType": "transit",
                    "stylers": [
                        {
                            "color": "#808080"
                        },
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#dcdfe6"
                        }
                    ]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "road.local",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#ffffff"
                        },
                        {
                            "weight": 1.8
                        }
                    ]
                },
                {
                    "featureType": "road.local",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#d7d7d7"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#ebebeb"
                        }
                    ]
                },
                {
                    "featureType": "administrative",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#a7a7a7"
                        }
                    ]
                },
                {
                    "featureType": "road.arterial",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "road.arterial",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#ffffff"
                        }
                    ]
                },
                {
                    "featureType": "landscape",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#efefef"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "color": "#696969"
                        }
                    ]
                },
                {
                    "featureType": "administrative",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#737373"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "labels.icon",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "labels",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "road.arterial",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#d6d6d6"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.icon",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {},
                {
                    "featureType": "poi",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#dadada"
                        }
                    ]
                }
            ]
        });
    }

    /* Banner sliding effect - IMPROVED without gap issues */
    function bannerSlideEffect() {
        var $banner = $('.banner_area');
        var $firstContentSection = $('.accomodation_area').first();
        var bannerHeight = $banner.outerHeight();
        
        // Store original margin to restore later
        var originalMarginTop = parseInt($firstContentSection.css('margin-top')) || 0;
        
        $(window).scroll(function() {
            var scrollTop = $(window).scrollTop();
            
            // Only apply effect when scrolling down, not up
            if (scrollTop > 0) {
                // Gradually reduce margin as user scrolls down
                var newMargin = Math.max(originalMarginTop - (scrollTop * 0.3), -bannerHeight * 0.5);
                $firstContentSection.css('margin-top', newMargin + 'px');
            } else {
                // Restore original margin when at top
                $firstContentSection.css('margin-top', originalMarginTop + 'px');
            }
        });
        
        // Initial state setup
        if ($(window).scrollTop() <= 0) {
            $firstContentSection.css('margin-top', originalMarginTop + 'px');
        }
    }
    bannerSlideEffect();

    /* Scroll position preservation - removed to allow back navigation to maintain scroll position */

    /* Banner search filter */
    function buildUniversitySelect(){
        var $uniSelect = $('#university-select');
        $uniSelect.empty();
        // Add a visible placeholder option
        $uniSelect.append($('<option>').val('').text('Select University').prop('selected', true));
        
        var universityCount = 0;
        $('.accomodation_two .accomodation_item').each(function(){
            var $a = $(this).find('a').first();
            var name = $a.text().trim();
            var href = $a.attr('href');
            if(name && href){
                $uniSelect.append($('<option>').val(href).text(name));
                universityCount++;
            }
        });
        
        console.log('Found', universityCount, 'universities');
        try{ $uniSelect.niceSelect('update'); }catch(e){}
        // Hide placeholder list items for the university select
        hidePlaceholderListItems($uniSelect);
    }

    function populateCampusSelectWithPlaceholder(){
        var $campSelect = $('#campus-select');
        $campSelect.empty();
        // Add a visible placeholder option
        $campSelect.append($('<option>').val('').text('Select Campus').prop('selected', true));
        try{ $campSelect.niceSelect('update'); }catch(e){}
        // Ensure placeholder list items are hidden in the generated nice-select
        hidePlaceholderListItems($campSelect);
    }

    function hidePlaceholderListItems($select){
        try{
            var $nice = $select.next('.nice-select');
            if(!$nice.length) return;
            var $items = $nice.find('ul li');
            $items.each(function(){
                var $li = $(this);
                var value = ($li.attr('data-value') || '').trim();
                var text = ($li.text()||'').trim().toLowerCase();
                // Remove items that come from an empty option or are explicitly disabled placeholders
                if(value === '' || $li.hasClass('disabled') || text === 'campus' || text === 'universities'){
                    $li.remove();
                }
            });
            // Ensure the .current text reflects an actual selection (or stays empty)
            var selectedVal = ($select.val() || '').trim();
            if(selectedVal === ''){
                // Keep placeholder visible as the closed label (if desired) but ensure it's not selectable
                var $cur = $nice.find('.current');
                // only clear if it's literally showing placeholder text
                if(($cur.text()||'').trim().toLowerCase() === 'campus' || ($cur.text()||'').trim().toLowerCase() === 'universities'){
                    // set to empty so it doesn't display like a selectable item
                    $cur.text('');
                }
            }
        }catch(e){ /* fail silently */ }
    }

    function animateHide($el, cb){
        $el.addClass('view-animatable fade-slide-exit');
        // force reflow
        $el[0].getBoundingClientRect();
        $el.addClass('fade-slide-exit-active');
        $el.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
            $el.removeClass('fade-slide-exit fade-slide-exit-active view-animatable');
            $el.hide();
            if(cb) cb();
        });
    }

    function animateShow($el){
        $el.show();
        $el.addClass('view-animatable fade-slide-enter');
        // force reflow
        $el[0].getBoundingClientRect();
        $el.addClass('fade-slide-enter-active');
        $el.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
            $el.removeClass('fade-slide-enter fade-slide-enter-active view-animatable');
        });
    }

    function renderCampuses(campuses, universityHref){
        // Remove existing filtered area with animation (if present)
        var $existing = $('#filtered-campus-area');
        if($existing.length){
            animateHide($existing, function(){ $existing.remove(); });
        }

        var $section = $('<section class="latest_blog_area section_gap" id="filtered-campus-area" style="display:none"><div class="container"><div class="row mb_30"></div></div></section>');
        var $row = $section.find('.row');
        if(!campuses || campuses.length===0){
            $row.append($('<div class="col-12"><p>No campuses found.</p></div>'));
        } else {
            campuses.forEach(function(c){
                var imgSrc = c.img || '';
                // Normalize image path (remove leading ../ if present)
                if(imgSrc.indexOf('../') === 0) imgSrc = imgSrc.replace('../','');

                var linkHref = c.link || '';
                var normalizedHref = linkHref;
                try{
                    // Resolve relative links against the university page URL to get an absolute URL
                    var baseUrl = new URL(universityHref, window.location.href);
                    var resolved = new URL(linkHref || '', baseUrl);
                    normalizedHref = resolved.href;
                    // For displaying a shorter link in the index (optional), convert to relative path from site root
                    // but keep href absolute to avoid navigation issues
                }catch(e){
                    // fallback to previous behavior
                    if(linkHref && !linkHref.startsWith('http') && !linkHref.startsWith('/')){
                        var prefix = '';
                        if(universityHref.indexOf('/') === -1){
                            prefix = 'Campuses/';
                        } else {
                            prefix = universityHref.substring(0, universityHref.lastIndexOf('/')+1);
                        }
                        normalizedHref = prefix + linkHref;
                    }
                }

                var $col = $('<div class="col-lg-4 col-md-6"></div>');
                var $card = $('<div class="single-recent-blog-post"></div>');
                var $thumb = $('<div class="thumb"></div>');
                $thumb.append($('<img>').addClass('img-fluid').attr('src', imgSrc).attr('alt','post'));
                var $details = $('<div class="details"></div>');
                $details.append($('<a>').attr('href', normalizedHref).append($('<h4>').addClass('sec_h4').text(c.title)));
                $card.append($thumb).append($details);
                $col.append($card);
                $row.append($col);
            });
        }

        // Animate hiding original universities grid, then insert and animate in the campus section
        var $orig = $('.accomodation_two');
        animateHide($orig, function(){
            $('.accomodation_area').after($section);
            animateShow($section);
        });
    }

    function fetchAndShowCampuses(href){
        $('#banner-search-result').text('Loading campuses...').show();
        fetch(href).then(function(r){ if(!r.ok) throw new Error('Network response was not ok'); return r.text();}).then(function(text){
            var parser = new DOMParser();
            var doc = parser.parseFromString(text, 'text/html');
            var items = doc.querySelectorAll('.single-recent-blog-post');
            var campuses = [];
            items.forEach(function(it){
                var img = '';
                var imgEl = it.querySelector('img');
                if(imgEl) img = imgEl.getAttribute('src') || '';
                var a = it.querySelector('.details a');
                var title = a ? a.textContent.trim() : (it.querySelector('.details h4') ? it.querySelector('.details h4').textContent.trim() : '');
                var link = a ? a.getAttribute('href') : '';
                campuses.push({img: img, title: title, link: link});
            });

            if(campuses.length === 0){
                $('#banner-search-result').text('No campuses found for this university.').show();
                renderCampuses([], href);
                populateCampusSelectWithPlaceholder();
            } else {
                $('#banner-search-result').hide();
                populateCampusSelectWithPlaceholder();
                var $campSelect = $('#campus-select');
                campuses.forEach(function(c){
                    var val = c.link || '';
                    try{
                        // Resolve relative campus link against the university page URL to get an absolute URL
                        var baseUrl = new URL(href, window.location.href);
                        var resolved = new URL(val || '', baseUrl);
                        val = resolved.href;
                    }catch(e){
                        // fallback to prior behavior
                        if(val && !val.startsWith('http') && !val.startsWith('/')){
                            var prefix = '';
                            if(href.indexOf('/') === -1){
                                prefix = 'Campuses/';
                            } else {
                                prefix = href.substring(0, href.lastIndexOf('/')+1);
                            }
                            val = prefix + val;
                        }
                    }
                    $campSelect.append($('<option>').val(val).text(c.title));
                });
                try{ $campSelect.niceSelect('update'); }catch(e){}
                renderCampuses(campuses, href);
            }
        }).catch(function(err){
            $('#banner-search-result').text('Error loading campuses.').show();
            console.error(err);
        });
    }

    // Page refresh functionality for returning from search results
    function handlePageRefreshOnReturn() {
        // Check if we're returning from a search result page
        const hasSearched = sessionStorage.getItem('hasSearched');
        
        if (hasSearched === 'true') {
            // Clear the search state
            sessionStorage.removeItem('hasSearched');
            
            // Reset the search form
            $('#university-select').val('');
            $('#campus-select').val('');
            populateCampusSelectWithPlaceholder();
            
            // Hide any search results
            $('#banner-search-result').hide();
            
            // Remove filtered campus area if it exists
            var $filtered = $('#filtered-campus-area');
            if($filtered.length){
                $filtered.remove();
            }
            
            // Show original universities grid
            animateShow($('.accomodation_two'));
            
            // Force a page refresh to ensure clean state
            window.location.reload();
        }
    }

    // Set search flag when navigating away
    function setSearchFlag() {
        sessionStorage.setItem('hasSearched', 'true');
    }

    $(document).ready(function(){
        // Handle page refresh on return
        handlePageRefreshOnReturn();
        
        if($('#university-select').length && $('#campus-select').length){
            // Build university options first
            buildUniversitySelect();
            populateCampusSelectWithPlaceholder();

            console.log('Select elements found, building options...');
            console.log('Using regular selects only (nice-select completely disabled)');

            // Test: Make sure we can see the options
            setTimeout(function(){
                var uniOptions = $('#university-select option').length;
                var campOptions = $('#campus-select option').length;
                console.log('University options:', uniOptions);
                console.log('Campus options:', campOptions);
                
                // Log the actual options
                $('#university-select option').each(function(i, opt){
                    console.log('Option', i, ':', $(opt).text(), '->', $(opt).val());
                });
                
                // Force the first option to be selected and visible
                $('#university-select').val('');
                $('#campus-select').val('');
            }, 200);

            // When university is changed, fetch and show campuses
            $('#university-select').on('change', function(){
                var href = $(this).val();
                if(!href){
                    $('#banner-search-result').hide();
                    populateCampusSelectWithPlaceholder();
                    var $filtered = $('#filtered-campus-area');
                    if($filtered.length){
                        animateHide($filtered, function(){
                            $filtered.remove();
                            animateShow($('.accomodation_two'));
                        });
                    } else {
                        animateShow($('.accomodation_two'));
                    }
                } else {
                    fetchAndShowCampuses(href);
                }
            });

            $('#banner-search-btn').on('click', function(){
                var university = $('#university-select').val();
                var campus = $('#campus-select').val();
                var universityText = $('#university-select option:selected').text();
                var campusText = $('#campus-select option:selected').text();
                
                if(!university || !campus){
                    $('#banner-search-result').text('Please select both a University and a Campus.').show();
                    return;
                }
                
                // Set search flag before navigating
                setSearchFlag();
                
                // Special case: University of Cape Town + Upper Campus should go to uct.html
                if(universityText === 'University of Cape Town' && campusText === 'Upper Campus'){
                    window.location.href = 'Campuses/uct.html';
                    return;
                }
                
                // For all other combinations, navigate to the selected campus page
                window.location.href = campus;
            });
        }
    });

    // Room Type Toggle Functionality
    function initRoomTypeToggle() {
        const toggleSwitch = document.getElementById('roomTypeToggle');
        const singleOption = document.querySelector('.toggle_option_small:first-child');
        const doubleOption = document.querySelector('.toggle_option_small:last-child');
        const roomTag = document.querySelector('.private_room_tag');
        const roomTitle = document.querySelector('.room_title');
        const guestsElement = document.querySelector('.room_meta span:last-child');
        const bedroomsElement = document.querySelector('.room_meta span:nth-child(2)');
        
        // Get both desktop and mobile price elements
        const desktopPriceElement = document.querySelector('.booking_card .price');
        const mobilePriceElement = document.querySelector('.booking-card-mobile .price');
        
        // Get both desktop and mobile room type displays
        const desktopRoomTypeDisplay = document.querySelector('.booking_card .room_type_display');
        const mobileRoomTypeDisplay = document.querySelector('.booking-card-mobile .room_type_display');
        
        if (!toggleSwitch) return;
        
        const roomData = {
            single: {
                tag: 'private room',
                title: 'Dambose Homes',
                price: 'R6,000',
                guests: 'Up to 1 guests',
                bedrooms: '1 Bedrooms',
                type: 'Single'
            },
            double: {
                tag: 'shared room',
                title: 'Dambose Homes',
                price: 'R5,000',
                guests: 'Up to 2 guests',
                bedrooms: '2 Bedrooms',
                type: 'Double'
            }
        };
        
        function updateRoomType(isDouble) {
            const roomType = isDouble ? 'double' : 'single';
            const data = roomData[roomType];
            
            // Update option colors
            if (isDouble) {
                singleOption.classList.remove('active');
                doubleOption.classList.add('active');
            } else {
                singleOption.classList.add('active');
                doubleOption.classList.remove('active');
            }
            
            // Update room details
            if (roomTag) roomTag.textContent = data.tag;
            if (roomTitle) roomTitle.textContent = data.title;
            if (guestsElement) guestsElement.innerHTML = `<i class="fa fa-users"></i> ${data.guests}`;
            if (bedroomsElement) bedroomsElement.innerHTML = `<i class="fa fa-bed"></i> ${data.bedrooms}`;
            
            // Update desktop price and room type
            if (desktopPriceElement) desktopPriceElement.innerHTML = `${data.price} <small>/ month</small>`;
            if (desktopRoomTypeDisplay) desktopRoomTypeDisplay.textContent = data.type;
            
            // Update mobile price and room type
            if (mobilePriceElement) mobilePriceElement.innerHTML = `${data.price} <small>/ month</small>`;
            if (mobileRoomTypeDisplay) mobileRoomTypeDisplay.textContent = data.type;
            
            // Update both book buttons
            const desktopBookBtn = document.querySelector('.booking_card .request_book_btn');
            const mobileBookBtn = document.querySelector('.booking-card-mobile .request_book_btn');
            
            if (desktopBookBtn) {
                desktopBookBtn.textContent = `Request to Book`;
            }
            if (mobileBookBtn) {
                mobileBookBtn.textContent = `Request to Book`;
            }
        }
        
        // Initialize with single room selected
        updateRoomType(false);
        
        // Toggle switch event listener
        toggleSwitch.addEventListener('change', function() {
            updateRoomType(this.checked);
        });
        
        // Option click events (clicking on text labels)
        singleOption.addEventListener('click', function() {
            toggleSwitch.checked = false;
            updateRoomType(false);
        });
        
        doubleOption.addEventListener('click', function() {
            toggleSwitch.checked = true;
            updateRoomType(true);
        });
    }
    
    // Initialize room type toggle when page loads
    initRoomTypeToggle();

    // Mobile Slider Functionality
    function initMobileSlider() {
        const sliderWrapper = document.querySelector('.slider_wrapper');
        const slides = document.querySelectorAll('.slide');
        const prevBtn = document.querySelector('.slider_prev');
        const nextBtn = document.querySelector('.slider_next');
        const dotsContainer = document.querySelector('.slider_dots');
        
        if (!sliderWrapper || slides.length === 0) return;
        
        let currentSlide = 0;
        const totalSlides = slides.length;
        let isTransitioning = false;
        let autoPlayInterval = null;
        
        // Clear existing dots
        dotsContainer.innerHTML = '';
        
        // Create dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
        
        const dots = document.querySelectorAll('.dot');
        
        function updateSlider() {
            if (isTransitioning) return;
            isTransitioning = true;
            
            // Force reflow to ensure smooth transition
            sliderWrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
            
            // Reset transition flag after animation completes
            setTimeout(() => {
                isTransitioning = false;
            }, 500);
        }
        
        function goToSlide(slideIndex) {
            if (isTransitioning || slideIndex === currentSlide) return;
            currentSlide = slideIndex;
            updateSlider();
        }
        
        function nextSlide() {
            if (isTransitioning) return;
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        }
        
        function prevSlide() {
            if (isTransitioning) return;
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        }
        
        // Event listeners
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prevSlide();
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            nextSlide();
        });
        
        // Auto-play functionality
        function startAutoPlay() {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(nextSlide, 5000);
        }
        
        function stopAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        }
        
        // Pause auto-play on hover
        const sliderContainer = document.querySelector('.slider_container');
        sliderContainer.addEventListener('mouseenter', stopAutoPlay);
        sliderContainer.addEventListener('mouseleave', startAutoPlay);
        
        // Touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartTime = 0;
        
        sliderContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartTime = Date.now();
        }, { passive: true });
        
        sliderContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            // Only handle swipe if it was quick (less than 300ms) to avoid conflicts with scrolling
            if (touchDuration < 300) {
                handleSwipe();
            }
        }, { passive: true });
        
        function handleSwipe() {
            if (isTransitioning) return;
            
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide(); // Swipe left, go to next
                } else {
                    prevSlide(); // Swipe right, go to previous
                }
            }
        }
        
        // Start auto-play
        startAutoPlay();
        
        // Cleanup function to prevent memory leaks
        return function cleanup() {
            stopAutoPlay();
            sliderContainer.removeEventListener('mouseenter', stopAutoPlay);
            sliderContainer.removeEventListener('mouseleave', startAutoPlay);
        };
    }
    
    // Initialize slider when page loads
    let sliderCleanup = null;
    if (window.innerWidth <= 480) {
        sliderCleanup = initMobileSlider();
    }
    
    // Re-initialize on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Cleanup existing slider
            if (sliderCleanup) {
                sliderCleanup();
                sliderCleanup = null;
            }
            
            // Re-initialize if still on mobile
            if (window.innerWidth <= 480) {
                sliderCleanup = initMobileSlider();
            }
        }, 250);
    });

    // Back to Top Button Functionality
    function initBackToTopButton() {
        // Show/hide back to top button based on scroll position
        $(window).scroll(function() {
            if ($(this).scrollTop() > 300) {
                $('#backToTop').addClass('show');
            } else {
                $('#backToTop').removeClass('show');
            }
        });
        
        // Scroll to top when button is clicked
        $('#backToTop').on('click', function(e) {
            e.preventDefault();
            
            // Try multiple scroll methods for maximum compatibility
            $('html, body').animate({
                scrollTop: 0
            }, {
                duration: 600,
                easing: 'swing'
            });
            
            // Fallback for browsers that don't support jQuery animation
            setTimeout(function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 100);
        });
    }

    // Initialize back to top button
    initBackToTopButton();

    // Accommodation Toggle Functionality
    function initAccommodationToggles() {
        // Only run on pages that have accommodation toggles
        if (!$('#accommodationToggle').length) return;
        
        // First toggle
        const $toggleBtn = $('#accommodationToggle');
        const $accommodationContent = $('#accommodationContent');
        const $toggleIcon = $toggleBtn.find('.collapsible-icon');
        
        // Set initial state - start expanded for first section
        $accommodationContent.removeClass('collapsed');
        $toggleBtn.removeClass('collapsed');
        $toggleIcon.text('-');
        
        $toggleBtn.on('click', function() {
            const isCollapsed = $accommodationContent.hasClass('collapsed');
            
            if (isCollapsed) {
                // Expand
                $accommodationContent.removeClass('collapsed');
                $toggleBtn.removeClass('collapsed');
                $toggleIcon.text('-');
            } else {
                // Collapse
                $accommodationContent.addClass('collapsed');
                $toggleBtn.addClass('collapsed');
                $toggleIcon.text('+');
            }
        });

        // Second toggle
        const $toggleBtn2 = $('#accommodationToggle2');
        const $accommodationContent2 = $('#accommodationContent2');
        const $toggleIcon2 = $toggleBtn2.find('.collapsible-icon');
        
        if ($toggleBtn2.length && $accommodationContent2.length) {
            // Set initial state - start collapsed
            $accommodationContent2.addClass('collapsed');
            $toggleBtn2.addClass('collapsed');
            $toggleIcon2.text('+');
            
            $toggleBtn2.on('click', function() {
                const isCollapsed = $accommodationContent2.hasClass('collapsed');
                
                if (isCollapsed) {
                    // Expand
                    $accommodationContent2.removeClass('collapsed');
                    $toggleBtn2.removeClass('collapsed');
                    $toggleIcon2.text('-');
                } else {
                    // Collapse
                    $accommodationContent2.addClass('collapsed');
                    $toggleBtn2.addClass('collapsed');
                    $toggleIcon2.text('+');
                }
            });
        }

        // Third toggle
        const $toggleBtn3 = $('#accommodationToggle3');
        const $accommodationContent3 = $('#accommodationContent3');
        const $toggleIcon3 = $toggleBtn3.find('.collapsible-icon');
        
        if ($toggleBtn3.length && $accommodationContent3.length) {
            // Set initial state - start collapsed
            $accommodationContent3.addClass('collapsed');
            $toggleBtn3.addClass('collapsed');
            $toggleIcon3.text('+');
            
            $toggleBtn3.on('click', function() {
                const isCollapsed = $accommodationContent3.hasClass('collapsed');
                
                if (isCollapsed) {
                    // Expand
                    $accommodationContent3.removeClass('collapsed');
                    $toggleBtn3.removeClass('collapsed');
                    $toggleIcon3.text('-');
                } else {
                    // Collapse
                    $accommodationContent3.addClass('collapsed');
                    $toggleBtn3.addClass('collapsed');
                    $toggleIcon3.text('+');
                }
            });
        }
    }

    // Initialize accommodation toggles
    initAccommodationToggles();

})(jQuery)
