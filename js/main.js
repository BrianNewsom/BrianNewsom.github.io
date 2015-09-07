// http://stackoverflow.com/a/281335
Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

jQuery(document).ready(function($){
	//set some variables
	var isAnimating = false,
		firstLoad = false,
		newScaleValue = 1;

	//cache DOM elements
	var dashboard = $('.cd-side-navigation'),
		mainContent = $('.cd-main'),
		loadingBar = $('#cd-loading-bar');

	//select a new section
	dashboard.on('click', 'a', function(event){
		event.preventDefault();

		var target = $(this),
			//detect which section user has chosen
			sectionTarget = target.data('menu');
		
		
		console.log(target);
		if( !target.hasClass('selected') && !isAnimating )  {
			//if user has selected a section different from the one alredy visible - load the new content
			triggerAnimation(sectionTarget, true);
		}

		firstLoad = true;
	});

	var currentPage = "";
	//detect the 'popstate' event - e.g. user clicking the back button
  	$(window).on('popstate', function() {
			console.log($(this));
	  	if( firstLoad ) {
		    /*
		    Safari emits a popstate event on page load - check if firstLoad is true before animating
		    if it's false - the page has just been loaded 
		    */
	      	var newPageArray = location.pathname.split('/'),
	        //this is the url of the page to be loaded 
	        newPage = newPageArray[newPageArray.length - 1].replace('.html', '');
					if (!currentPage) currentPage = newPage;
	

					if(currentPage == newPage) { firstLoad = true; }
	      	else if( !isAnimating ) triggerAnimation(newPage, false);
	    }
	    firstLoad = true;
	});

  	//scroll to content if user clicks the .cd-scroll icon
	mainContent.on('click', '.cd-scroll', function(event){
		event.preventDefault();
		var scrollId = $(this.hash);
		$(scrollId).velocity('scroll', { container: $(".cd-section") }, 200);
	});

	//start animation
	function triggerAnimation(newSection, bool) {
		isAnimating =  true;
		newSection = ( newSection == '' ) ? 'index' : newSection;
		
		//update dashboard
		dashboard.find('*[data-menu="'+newSection+'"]').addClass('selected').parent('li').siblings('li').children('.selected').removeClass('selected');
		//trigger loading bar animation
		initializeLoadingBar(newSection);
		//load new content
		loadNewContent(newSection, bool);
	}

	function initializeLoadingBar(section) {
		var	selectedItem =  dashboard.find('.selected'),
			barHeight = selectedItem.outerHeight(),
			barTop = selectedItem.offset().top,
			windowHeight = $(window).height(),
			maxOffset = ( barTop + barHeight/2 > windowHeight/2 ) ? barTop : windowHeight- barTop - barHeight,
			scaleValue = ((2*maxOffset+barHeight)/barHeight).toFixed(3)/1 + 0.001;
		
		//place the loading bar next to the selected dashboard element
		loadingBar.data('scale', scaleValue).css({
		    height: barHeight,
		    top: barTop
		}).attr('class', '').addClass('loading '+section);
	}

	function loadNewContent(newSection, bool) {
		setTimeout(function(){
			//animate loading bar
			loadingBarAnimation();
			
			//create a new section element and insert it into the DOM
			var section = $('<section class="cd-section overflow-hidden '+newSection+'"></section>').appendTo(mainContent);
			//load the new content from the proper html file
			section.load(newSection+'.html .cd-section > *', function(event){
				//finish up the animation and then make the new section visible
				var scaleMax = loadingBar.data('scale');
				
				loadingBar.velocity('stop').velocity({
					scaleY: scaleMax
				}, 400, function(){
					//add the .visible class to the new section element -> it will cover the old one
					section.prev('.visible').removeClass('visible').end().addClass('visible').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
						resetAfterAnimation(section);
					});

					//if browser doesn't support transition
					if( $('.no-csstransitions').length > 0 ) {
						resetAfterAnimation(section);
					}

					var url = newSection+'.html';

					if(url!=window.location && bool){
				        //add the new page to the window.history
				        //if the new page was triggered by a 'popstate' event, don't add it
				        window.history.pushState({path: url},'',url);
				    }
				});
			});

		}, 50);
	}

	function loadingBarAnimation() {
		var scaleMax = loadingBar.data('scale');
		if( newScaleValue + 1 < scaleMax) {
			newScaleValue = newScaleValue + 1;
		} else if ( newScaleValue + 0.5 < scaleMax ) {
			newScaleValue = newScaleValue + 0.5;
		}
		
		loadingBar.velocity({
			scaleY: newScaleValue
		}, 100, loadingBarAnimation);
	}

	function resetAfterAnimation(newSection) {
		//once the new section animation is over, remove the old section and make the new one scrollable
		newSection.removeClass('overflow-hidden').prev('.cd-section').remove();
		isAnimating =  false;
		//reset your loading bar
		resetLoadingBar();
	}

	function resetLoadingBar() {
		loadingBar.removeClass('loading').velocity({
			scaleY: 1
		}, 1);
	}

	var $slider = $('.slider'),
			$wrapper = $slider.find('.slide-wrapper'),
			$slides = $slider.find('.slide'),
			slideWidth = $slider.width();

	if(!$slides.filter('.active').length){
			$slides.first().addClass('active');
	}

	var totalWidth = 0;
	$slides.each(function(){
			var $self = $(this),
					width = $self.innerWidth();
			totalWidth += width;

			$self.css('width', width);
	});

	$wrapper.css('width', totalWidth);

	$slider.find('.text').each(function(){
			var $self = $(this),
					text = $self.text(),
					newText = text.split(/[\s,]+/);

			if(newText.length){ newText = newText.clean("") }

			var html = '';
			for(var i in newText){
					var keyword = newText[i];
					if(typeof keyword == 'string'){
							html += '<span class="keyword" data-key="'+ keyword +'">' + keyword + '</span> ';
					}
			}

			$self.html(html);
	});

	$slider.find('.keyword').each(function(){
			var $this = $(this),
					position = $this.position();
			$this.css(position).data('position', position);
	}).promise().done(function(){
			$(this).css('position', 'absolute');
	});


	var blockedClick = false;
	$('.arrow').click(function(e){
			e.preventDefault();

			if(blockedClick == false){
					blockedClick = true;
					slide( $(this).hasClass('arrow-prev') ? 'left' : 'right' );
			}
	});

	var timeout = null;
	var slide = function(direction){

			var $nextSlide, $currentSlide;
			$currentSlide = $slides.filter('.active');

			if(direction == 'right'){
					$nextSlide = $currentSlide.next('.slide');
			}else{
					$nextSlide = $currentSlide.prev('.slide');
			}

			if(!$nextSlide.length){
					blockedClick = false;
					return;
			}

			$currentSlide.removeClass('to-left to-right');

			var translate = slideWidth * ($nextSlide.index());

			$wrapper.css('transform', 'translateX('+ -translate + 'px)');

			var $currentKeywords = $currentSlide.find('.keyword'),
					$nextKeywords = $nextSlide.find('.keyword');

			$nextKeywords.show().each(function(){
					var $next = $(this),
							nextKey = $next.data('key');

					$currentKeywords.each(function(){
							var $current = $(this),
									currentKey = $current.data('key');

							if(nextKey == currentKey){
									$current.css($next.position()).css('transform', 'translateX('+ ( direction == 'left' ? -slideWidth : slideWidth) + 'px)');
							}
					});
			}).promise().done(function(){
					var x = 0;

					$currentKeywords.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
							++x;

							if(x == $(this).length){
									$currentSlide.removeClass('active');
									$nextSlide.addClass('active');

									blockedClick = false;

									clearTimeout(timeout);
									timeout = setTimeout(function(){
											$currentKeywords.hide().css('transition', 0).each(function(){
													var $this = $(this);
													$this.css($this.data('position')).css('transform', '');
											}).promise().done(function(){
													$(this).css('transition', '');
													blockedClick = false;
											});
									},500);
							}
					});
			});

	}

});
