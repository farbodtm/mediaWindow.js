
/*	mediaWindow.js version 0.1.0
*	Mashiya
*	by Farbod Motlagh
*/


(function (window, document, undefined) {

	var $ = window.jQuery
	  , flowplayer = window.flowplayer;

	// mediaWindow.js version
	var Version = '0.1.0';

	// MediaWindow Main Class
	function MediaWindow () {

		this._options = {

			nextAndPrevButtons: true,
			
			defaultWidth: 800,
			defaultHeight: 450,
			
			minWidth: 600,
			minHeight: 150,
			
			videoWidth: 800,
			videoHeight: 450,
			
			musicWidth: 600,
			musicHeight: 150,
			
			maxWidth: 900,
			maxHeight: 600,
			
			timeOut: 15000,
			JSONurl: '',

			mediaKeys: {
				textField: 'text',
				mediaType: 'file_type',
				mediaAdd: 'file'
			}
		};
		this._query = {};
		this._ajaxData = null;
	}
	/* Initialization of mediaWindow.js
	 * 
	 * takes the JSON file's address and save it in '_options.JSONurl'
	 * takes calls _getData function to make ajax call for getting JSON data
	 * copies maxs and mins since these variables can be changed in future
	 *
	 * @api - public
	 * @param [string] 
	 *
	 */
	
	function _init (JSONurl, pageQuery) {
		if(JSONurl){
			this._options.JSONurl = JSONurl;
		} else {
			console.log('Need JSON file url.');
			return false;
		}

		_getData.call(this, pageQuery);
		this._mainQuery = _cloneObject(pageQuery);

		this._options.defaultMaxWidth = this._options.maxWidth;
		this._options.defaultMinWidth = this._options.minWidth;
		this._options.defaultMaxHeight = this._options.maxHeight;
		this._options.defaultMinHeight = this._options.minHeight;
	}

	// Size Optimization - Optimize maxs and mins based on users' screen
	/*
     *
	 * @api - private
	 */
	function _sizeOptimize () {
		var ww = $(window).width()-50;
		var wh = $(window).height()-50;

		this._options.maxWidth = this._options.defaultMaxWidth;
		this._options.maxHeight = this._options.defaultMaxHeight;
		this._options.minWidth = this._options.defaultMinWidth;
		this._options.minHeight = this._options.defaultMinHeight;

		if (ww <= this._options.maxWidth){
			this._options.maxWidth = ww - 25;
		}
		if (wh <= this._options.maxHeight){
			this._options.maxHeight = wh - 25;
		}

		if (ww <= this._options.minWidth){
			this._options.minWidth = ww - 50;
		}
		if (wh <= this._options.minHeight){
			this._options.minHeight = wh - 50;
		}

	}

	//Overlay Functions
	/*
	 * create the overlay element, add click event (which close current open window)
	 * remove scroll bar by change the overflow property of body element to hidden
	 *
	 * @api - private
	 */
	function _showOverlay () {
		var self = this
		  , overlayElement = $('<div class="mediawindow-overlay"></div>')
		  , body = $('body');
		overlayElement.on('click', function(){
			_closeWindow.call(self,true);
		});
		body.prepend(overlayElement);
		overlayElement.show();
		body.css('overflow','hidden');
	}
	/*
	 * remove the overlay element and change the overflow property of body to visible.
	 *
	 * @api - private
	 */
	function _removeOverlay () {
		var overlayElement = $('.mediawindow-overlay');
		overlayElement.hide();
		overlayElement.remove();
		$('body').css('overflow','visible');
	}

	// Spinner Functions
	/*
	 * create and prepend the spinner element to body, detach the keydown event from window element
	 *
	 * @api - private
	 */
	function _showSpinner (){
		var self = this
		  , loading = "<div id='squaresWaveG'><div id='squaresWaveG_1' class='squaresWaveG'></div><div id='squaresWaveG_2' class='squaresWaveG'></div><div id='squaresWaveG_3' class='squaresWaveG'></div><div id='squaresWaveG_4' class='squaresWaveG'></div><div id='squaresWaveG_5' class='squaresWaveG'></div><div id='squaresWaveG_6' class='squaresWaveG'></div><div id='squaresWaveG_7' class='squaresWaveG'></div><div id='squaresWaveG_8' class='squaresWaveG'></div></div>";
		$('body').prepend($('<div class="mediawindow-spinner"></div>').html(loading));
		$(window).off('keydown');
	}
	/*
	 * remove the spinner element and attach _onKeydown function to window element
	 *
	 * @api - private
	 */
	function _hideSpinner () {
		var self = this
		  , spinner = $('.mediawindow-spinner')
		  , w = $(window);
		if (spinner.length > 0){
			spinner.remove();
			w.off('keydown');
			w.on('keydown',{mw: self},_onKeydown);
		}
				
	}
	// Next and Previous Functions
	/*
	 * go to next item by close this window and open a new window also check if it is last item or not
	 * will call the _changePage it is not the last page
	 *
	 * @api - public
	 */
	function _nextItem (callback) {

		if ($('.mediawindow-box').length <= 0){
			return false;
		}

		nextId = $('.mediawindow-box').data('nextItem');

		if (!nextId){
			if (this._itemsData.pagesinfo.page !== this._itemsData.pagesinfo.pages){
				_changePage.call(this, { where: 'next', query: this.query });
			}
			return false;
		}

		_closeWindow.call(this, false);
		_openWindow.call(this, nextId);	
		if (typeof callback === 'function'){
			callback.call(this);
		}
	}
	/*
	 * go to prev item by close this window and open a new window also check if it is first item or not
	 * will call the _changePage it is not the first page
	 *
	 * @api - public
	 */
	function _prevItem (callback) {

		if ($('.mediawindow-box').length <= 0){
			return false;
		}

		prevId = $('.mediawindow-box').data('prevItem');

		if (!prevId){
			if (this._itemsData.pagesinfo.page !== 1){
				_changePage.call(this, { where: 'prev', query: this._query });
			}
			return false;
		}

		_closeWindow.call(this, false);
		_openWindow.call(this, prevId);
		if (typeof callback === 'function'){
			callback.call(this);
		}
	}
	/*
	 * change the query for JSON url and call getData to get the new data.
	 * 
	 * @api private
	 * @param [object]
	 */
	function _changePage (options) {
		var self = this
		  , query = options.query;

		_showSpinner.call(self);

		if (!query.page){
			query.page = '1';
		}

		if (_options.where === 'next'){
			query.page = parseInt(query.page, 10) + 1;
		} 
		if (_options.where === 'prev'){
			query.page = parseInt(query.page, 10) - 1;
		}
		if (_options.where === 'page'){
			query.page = options.page;
		}

		_getData.call(self, query, function(result, self){
			if (_options.where === 'next' || _options.where === 'prev'){

				_closeWindow.call(self,false);

				if (_options.where === 'next'){
					_openWindow.call(self, result.items[0].id);
				}

				if (_options.where === 'prev'){
					_openWindow.call(self, result.items[result.items.length-1].id);
				}			

			}
		});
	}
	//Open and Close Functions


	/*
	 * gets an id and open the media window of that id if the id is in the JSON 
	 * 
	 * @api - public
	 * @param [string]
	 */
	function _openWindow (id, callback) {
		var self = this
		  , data = this._itemsData;
		
		// If there is an window in DOM return false
		if ($('.mediawindow-box').length > 0){
			return false;
		}

		if (!data){
			if (!self._ajaxData){
				var pageQuery = _cloneObject(this._mainQuery);

				_showSpinner.call(self);
				_getData.call(self, pageQuery, function() {
					_openWindow.call(self, id);
					_hideSpinner.call(self);
				});
			}
			return false;
		}
		// get window size based on content and addBox to the DOM					
		var size = _getWindowSize.call(self, id)
		  , boxElement = _addBox.call(self);
		// fetch the data related to item to the window
		_fetchDataBox.call(self, id, boxElement);
		// show overlay
		_showOverlay.call(self);
		// show the window
		_showBox.call(self);
		// change the size of the window with 'size' variable
		_setBoxSize.call(self, boxElement, size.width, size.height);
		// bind box events such as next, previous and close events
		_bindBoxEvents.call(self);

		if (typeof callback === 'function'){
			callback.call(this);
		}
		/*if ($('.mediawindow-box td').length === 0 ){
			_closeWindow.call(self, true);
		}*/
	}
	/*
	 * close the media window
	 * 
	 * @api - public
	 * @param [boolean]
	 */
	function _closeWindow (reset, callback) {
		// remove the overlay
		_removeOverlay();
		// hide and remove the box from DOM
		_hideBox();
		_removeBox();
		// detach the keydown event from window object
		$(window).off('keydown');
		// if 'reset' is true, which means that user has closed the mediaWindow, it will call _getData if the query has been changed
		if(reset){
			var pageQuery = _cloneObject(this._mainQuery);
			_getData.call(this, pageQuery);
		}
		_sizeOptimize.call(this);
		_hideSpinner.call(this);
		if (typeof callback === 'function'){
			callback.call(this);
		}
	}
	// Add Box Function
	/*
	 * create mediaWindow elements and prepend them to the body
	 * 
	 * @api - private
	 * @return boxElement (mediaWindow Box)
	 */
	function _addBox () {
		var self = this

		  , boxElement = $('<div class="mediawindow-box"></div>')

		  , descriptionElement = $('<div class="mediawindow-description"></div>')

		  , mediaElement = $('<div class="mediawindow-media"></div>')

		  , descriptionDiv = $('<div class="mediawindow-description-div"></div>')
		  , descriptionTable = $('<table class="mediawindow-description-table"></table>')
		  , descriptionSocial = $('<table class="mediawindow-social-table"></table>')

		  , closeButton = $('<div class="mediawindow-button-close"></div>')
		  , nextButton = $('<div class="mediawindow-button-next"></div>')
		  , prevButton = $('<div class="mediawindow-button-prev"></div>');

		$('body').prepend(boxElement);

		boxElement.append(descriptionElement);
		boxElement.append(mediaElement);

		descriptionElement.append(descriptionDiv);
		descriptionDiv.append(descriptionTable);
		//descriptionDiv.append(descriptionSocial);

		//Close Button
		boxElement.prepend(closeButton);
		closeButton.on('click', function(){
			_closeWindow.call(self ,true);
		});

		//Next & Previous Buttons
		boxElement.prepend(nextButton);
		boxElement.prepend(prevButton);
		nextButton.on('click', function(){
			_nextItem.call(self);
		});
		prevButton.on('click', function(){
			_prevItem.call(self);
		});

		return boxElement;
	}
	/*
	 * remove the media window from DOM
	 * 
	 * @api - private
	 * 
	 */
	function _removeBox () {
		$('.mediawindow-box').remove();
	}
	/*
	 * show the media window
	 * 
	 * @api - private
	 * 
	 */
	function _showBox () {
		$('.mediawindow-box').show();
	}
	/*
	 * hide the media window from DOM
	 * 
	 * @api - private
	 * 
	 */
	function _hideBox () {
		$('.mediawindow-box').hide();
	}
	/*
	 * bind the mediaWindow mouse and keyboard events - next,previous,close
	 * 
	 * @api - private
	 * 
	 */
	function _bindBoxEvents () {
		var self = this
		  , mediawindowBox = $('.mediawindow-box')
		  , buttonNext = $('.mediawindow-button-next')
		  , buttonPrev = $('.mediawindow-button-prev')
		  , mouseoverClass = 'mediawindow-mouseover';
		$(window).off('keydown');
		$(window).on('keydown',{mw: self},_onKeydown);

		mediawindowBox.on('mouseover','.mediawindow-media', function (){
			buttonNext.addClass(mouseoverClass);
			buttonPrev.addClass(mouseoverClass);
		});
		mediawindowBox.on('mouseout','.mediawindow-media', function (){
			buttonNext.removeClass(mouseoverClass);
			buttonPrev.removeClass(mouseoverClass);
		});
		mediawindowBox.on('mouseover','.mediawindow-button-next',function(){
			buttonPrev.addClass(mouseoverClass);
		});
		mediawindowBox.on('mouseover','.mediawindow-button-prev',function(){
			buttonNext.addClass(mouseoverClass);
		});
	}
	/*
	 * keydown callback function
	 * 
	 * @api - private
	 * @param [object] event
	 */
	function _onKeydown (e) {
			var kcode = e.keyCode || e.which; 
			switch(kcode){
				case 39:
					_nextItem.call(e.data.mw);
					break;
				case 37:
					_prevItem.call(e.data.mw);
					break;
				case 27:
					_closeWindow.call(e.data.mw,true);
					break;
			}
	}
	/*
	 * get mediaWindow size for specific item
	 * 
	 * @api - private
	 * @param [string] id
	 * @return [object] size (width,height)
	 */	
	function _getWindowSize (id) {
		var self = this
		  , filetype = self._options.mediaKeys.mediaType
		  , fileadd = self._options.mediaKeys.mediaAdd
		  , size = {}
		  , item;
		if (id) {		

			if (!_getItem.call(this,id)) {
				return false;
			}

			item = _getItem.call(this,id);

			switch (item[filetype]) {
				// Image
				case 'image/jpeg':
				case 'image/gif':
				case 'image/png':
					if (!item.image) {
						size.width = self._options.defaultWidth;
						size.height = self._options.defaultHeight;
					} else {
						size = _putInRangeImage.call(this, item.image.width, item.image.height);
					}
					break;
				// Video
				case 'video/mp4':
				case 'youtube':
					size.width = self._options.videoWidth;
					size.height = self._options.videoHeight;
					break;
				// Music
				case 'audio/mp3':
					size.width = self._options.musicWidth;
					size.height = self._options.musicHeight;
					break;
				default:
					size.width = self._options.defaultWidth;
					size.height = self._options.defaultHeight;
					break;
			}
		} else {
			size = _putInRange.call (this.mediaWindow, this.width, this.height);
		}
		return size;
	}

	//DATA Fetching Function
	/*
	 * fetch data for specific id on sepecific boxEl
	 * 
	 * @api - private
	 * @param [string] id
	 * @param [element] boxEl
	 * @return [element] boxEl
	 */	
	function _fetchDataBox (id, boxEl) {
		var self = this
		  , filetype = self._options.mediaKeys.mediaType
		  , fileadd = self._options.mediaKeys.mediaAdd
		  , text =  self._options.mediaKeys.textField
		  , item;

		// Get the Item by calling _getItem
		if (!_getItem.call(this, id, true)) {
			return false;
		}

		item = _getItem.call(this, id, true);
		
		// Description Fields Here
		// Create the description table and append it to the window
		var i = 0;
		for (var field in item) {
			if (field !== self._options.mediaKeys.mediaType && field !== self._options.mediaKeys.mediaAdd && field !== 'id' && field !== 'text' && field !== 'image' && field !== 'nextItem' && field !== 'prevItem'){
				i++;
				if (item[field]) rowElement = $('<tr><td class="mediawindow-description-title">' + field + ':' + '</td><td>' + item[field] + '</td></tr>');
				else rowElement = $('<tr><td class="mediawindow-description-title"><strong>' + field + '<strong></td><td>' + item[field] + '</td></tr>');
				boxEl.find('.mediawindow-description-table').append(rowElement);
				rowElement.addClass('field' + i);
			}
		}
		i = null;
		//Social Buttons
		/*var twitter = $('');
		var facebook = $('');
		boxEl.find('.mediawindow-social-table').append(facebook);
		boxEl.find('.mediawindow-social-table').append(twitter);
		window.FB.XFBML.parse(document,function(){
			$('.fb_edge_widget_with_comment iframe').css('z-index','99999999');
			boxEl.find('.mediawindow-social-table').css('visibility','visible');
		});
		window.twttr.widgets.load();*/
		boxEl.find('.mediawindow-social-table').css('visibility','visible');
		boxEl.find('.mediawindow-social-table').height(85);
		//Social Buttons

		// Append the Media Element to the window
		switch (item[filetype]){
			case 'image/jpeg':
			case 'image/gif':
			case 'image/png':
				// if image is loaded append it to element, otherwise load the image
				if (item.image) {
					$('.mediawindow-media').append($('<div class="mediawindow-media-image"></div>').append(item.image));
				} else {
					_showSpinner.call(self);
					var image = new Image();
					image.name = 'imageItem' + item.id;
					image.mediaWindow = self;
					image.onload = _changeBoxSize;
					image.src = item[fileadd];	
				}

				break;
			case 'video/mp4':			
				// append video to the Window via - http://flash.flowplayer.org/
				$('.mediawindow-media').append($('<div id="mediawindow-media"></div>'));
				flowplayer("mediawindow-media", {
				    src:"http://www.greens-art.net/js/flowplayer-3.2.16.swf",
				    wmode: "transparent" // This allows the HTML to hide the flash content
				    }, {
				    clip: {
				      url: item[fileadd]
				    }
				});
				break;
			case 'youtube':
				// append youtube embed video
				$('.mediawindow-media').append($('<iframe width="0" height="0" src="http://www.youtube.com/embed/'+item[fileadd]+'?wmode=transparent" frameborder="0" allowfullscreen></iframe>'));
				break;
			case 'audio/mp3':
				// append music player to the Window via - http://flash.flowplayer.org/
				//HTML for Music Box
				var htmlVideo = '<div class="mediawindow-media-music"><a href="' + item[fileadd] + '" id="mediawindow-player" style="height: 30px;"></a></div>';

				//Fill mediawindow-media
				$('.mediawindow-media').html(htmlVideo);

				//Trigger FlowPlayer - Optimized for Music
				flowplayer("mediawindow-player",{
				    src:"http://www.greens-art.net/js/flowplayer-3.2.16.swf",
				    wmode: "opeque" // This allows the HTML to hide the flash content
				    },{
					plugins: {
						controls: {
							fullscreen: false,
							height: 30,
							autoHide: false
						}
					},
				});	

				// Make Music Box Center Vertical
				$('.mediawindow-media-music').css('margin-top',((self._options.musicHeight / 2) - 15) + 'px');

				break;
			default:
				$('.mediawindow-media').append($('<div class="mediawindow-text"></div>').append($('<p></p>').html(item[text])));
				break;
		}
		// Show or Hide Next and Previous buttons if there are others item
		if (this._options.nextAndPrevButtons){
			if(item.nextItem){
				boxEl.data('nextItem', item.nextItem);
				$('.mediawindow-button-next').show();
			} else {
				if ((this._itemsData.pagesinfo.page === this._itemsData.pagesinfo.pages)){
					$('.mediawindow-button-next').hide();
				}
			}
			if(item.prevItem){
				boxEl.data('prevItem', item.prevItem);
				$('.mediawindow-button-prev').show();
			} else {
				if ((this._itemsData.pagesinfo.page === 1)){
					$('.mediawindow-button-prev').hide();
				}
			}
		}
		return boxEl;
	}
	
	/*
	 * set box size after fetching data
	 * 
	 * @api - private
	 * @param [element] boxElement
	 * @param [integer] width
	 * @param [integer] height
	 * 
	 */	
	function _setBoxSize (boxElement, width, height) {
		_windowSize.call(this, boxElement, width, height);
		// Add scroll to text by mCustomScrollbar
		$('.mediawindow-text').mCustomScrollbar({
			theme:"dark-2",
			scrollButtons:{
					enable:true
			},
			advanced:{
				updateOnBrowserResize: true
			}
		});

		return true;
	}
	/*
	 * image onLoad callback, which has same functionality as '_setBoxSize'
	 * if an image isn't loaded when user click on the item, after loading the image this function will be called
	 *
	 * @api - private
	 * 
	 */	
	function _changeBoxSize () {
		if (this.naturalHeight){
			height = this.naturalHeight;
		} else {
			height = this.height;
		}
		if (this.naturalWidth){
			width = this.naturalWidth;
		} else {
			width = this.width;
		}
		var mediawindowBox = $('.mediawindow-box');
		_windowSize.call(this.mediaWindow, mediawindowBox, width, height);
		_hideSpinner.call(this.mediaWindow);
		this.mediaWindow = null;
		return true;
	}
	/*
	 * common parts of '_setBoxSize' and '_changeBoxSize'
	 *
	 * @api - private
	 * 
	 */		
	function _windowSize (boxElement, width, height) {
		var mediawindowBox = $('.mediawindow-box');
		height = height + mediawindowBox.find('.mediawindow-description').height();

		
		if (!_isNumber(width))
			width = this._options.deafultWidth;

		if (!_isNumber(height))
			height = this._options.deafultHeight;

		var size = _putInRangeImage.call(this, width, height);
		height = size.height;
		width = size.width;

		if (width % 2 !== 0)
			width++;

		$(boxElement).css('width', width + 'px');
		$(boxElement).css('margin-left', -(width/2) + 'px');

		//Description and Social Buttons Optimization	
		if (mediawindowBox.find('.mediawindow-description-table').height() > 77){ 
			mediawindowBox.find('.mediawindow-social-table').height(mediawindowBox.find('.mediawindow-description-table').height());
		} else {
			mediawindowBox.find('.mediawindow-social-table').height(77);
		}
		mediawindowBox.find('.mediawindow-description-div').height(mediawindowBox.find('.mediawindow-social-table').height());
		
		if (height % 2 !== 0)
			height++;

		$(boxElement).css('height', height + 'px');
		$(boxElement).css('margin-top', -(height/2) + 'px');
		
		
		mediawindowBox.find('.mediawindow-media').width(width);
		mediawindowBox.find('.mediawindow-media').height(height - mediawindowBox.find('.mediawindow-description').height());
		mediawindowBox.find('.mediawindow-media-image').width(width);
		mediawindowBox.find('.mediawindow-media-image').height(height - mediawindowBox.find('.mediawindow-description').height());
		if (mediawindowBox.find('.mediawindow-media').find('img')){
			if (height > this._options.minHeight){
				mediawindowBox.find('.mediawindow-media').find('img').height(height - mediawindowBox.find('.mediawindow-description').height());
			}
			if (width > this._options.minWidth){
				mediawindowBox.find('.mediawindow-media').find('img').width(width); 
			}
		}

		mediawindowBox.find('.mediawindow-button-prev').css('top',(((mediawindowBox.find('.mediawindow-description').height() + height)/2) - 25)+'px');
		mediawindowBox.find('.mediawindow-button-next').css('top',(((mediawindowBox.find('.mediawindow-description').height() + height)/2) - 25)+'px');
		
		mediawindowBox.find('.mediawindow-media').find('#mediawindow-media').width(width);
		mediawindowBox.find('.mediawindow-media').find('#mediawindow-media').height(height - mediawindowBox.find('.mediawindow-description').height());
		
		mediawindowBox.find('.mediawindow-media iframe').width(width);
		mediawindowBox.find('.mediawindow-media iframe').height(height - mediawindowBox.find('.mediawindow-description').height());

		if ($('html').attr('lang') === 'fa'){
			mediawindowBox.find('.mediawindow-description-table').width(mediawindowBox.find('.mediawindow-description-div').width() - 105);
			mediawindowBox.find('.mediawindow-social-table').width(100);
		} else {
			mediawindowBox.find('.mediawindow-description-table').width(mediawindowBox.find('.mediawindow-description-div').width() - 135);
			mediawindowBox.find('.mediawindow-social-table').width(130);			
		}
		mediawindowBox.find('.small td').height(mediawindowBox.find('.mediawindow-description-table').height() - 60);
	}
	//IMAGE Preloading Functions
	/*
	 * preload all images in the JSON data
	 * 
	 * @api - public
	 * 
	 */	
	function _preloadImages () {
		var self = this
		   ,data = self._itemsData
		   ,filetype = self._options.mediaKeys.mediaType
		   ,fileadd = self._options.mediaKeys.mediaAdd;
		if (!data){
			return false;
		} else {
			data = data.items;
		}
		for (var i = 0; i <= data.length-1; i++){
			var item = data[i];
			if (item[filetype] === 'image/jpeg' || item[filetype] === 'image/gif' || item[filetype] === 'image/png'){
				// get image width & height via http://stackoverflow.com/questions/106828/javascript-get-image-height
				var image = new Image();
					image.name = 'imageItem' + item.id;
					image.mediaWindow = self;
					image.itemNumber = i;
					image.onload = _fetchImageData;
					image.src = item[fileadd];
			}
		}
	}
	/*
	 * fetch image data to _itemsData object
	 * (preloadImages callback)
	 * 
	 * @api - private
	 * 
	 */	
	function _fetchImageData () {
		var self = this.mediaWindow
		   ,i = this.itemNumber;
		this.mediaWindow = null;
		this.itemNumber = null;
		if(this.width !== 0 || this.height !== 0){
			self._itemsData.items[i].image = this;
		}
	}
	/*
	 * get JSON data of items
	 * 
	 * @api - public
	 * @param [object] query
	 * @param [function] callback
	 * 
	 */	
	// GET DATA and GET ITEM Function
	function _getData (query, callback) {
		var self = this;
		self._itemsData = null;
		if (!query){
			query = self._mainQuery;
		}

		if (self._ajaxData){
			self._ajaxData.abort();
		}

		self._ajaxData = $.ajax(self._options.JSONurl + '?', {
			data: query

		  , dataType: 'json'

		  , timeout: self._options.timeOut

		  , cache: true

		  , beforeSend : function () {	

			}
		  , complete : function () {
				self._ajaxData = null;
			}
		  , success : function (result) {
				self._itemsData = result;

				_preloadImages.call(self);

				if (typeof (callback) === 'function') {
					callback(result, self);
				}

				self.query = query;
			}
		  , error : function (result) {
				if (result.statusText != "abort") {
					throw new Error('Error in getting data.' + result.statusText);
				}
			}
		});

	}
	/*
	 * get a specific item - if nextprev is true it will add next and prev property to the item
	 * 
	 * @api - private
	 * @param [id] string
	 * @param [nextprev] boolean
	 * 
	 */	
	function _getItem (id, nextprev) {
		var self = this
		  , data = self._itemsData
		  , item
		  , iitem
		  , index;

		if (! (data && data.items) ){
			return false;
		}

		var items = data.items;
			
		for (var i = 0; i <= items.length-1; i++){
			iitem = items[i];
			if (iitem.id == id){
				item = iitem;
				index = i;
			}
		}
		if (nextprev){
			if (items[index+1]){
				item.nextItem = items[index+1].id;
			}
			if (items[index-1]){
				item.prevItem = items[index-1].id;
			}
		}

		if (!item){
			return false;
		}
		return item;
	}
	//Utility Functions
	/*
	 * check if 'n' is a number or not
	 * 
	 * @api - private
	 * @param [string,integer] id
	 * @return [boolean]
	 * 
	 */	
	function _isNumber (n) {
		if (n){
			if (typeof n === "string"){
				if (parseInt(n, 10))
					return parseInt(n, 10);
				else
					return false;
			} else if (typeof n === "number") {
				return parseInt(n, 10);
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	/*
	 * put width and height in between maxs and mins
	 * 
	 * @api - private
	 * @param [integer] width
	 * @param [integer] height
	 * @return [object] size(width,height)
	 * 
	 */	
	function _putInRange (width, height){
		var self = this;
		if (width > self._options.maxWidth)
			width = self._options.maxWidth;
		if (width < self._options.minWidth)
			width = self._options.minWidth;
		if (height > self._options.maxHeight)
			height = self._options.maxHeight;
		if (height < self._options.minHeight)
			height = self._options.minHeight;
		var size = {
			width: width,
			height: height
		};
		return size;
	}
	/*
	 * put width and height of image between maxs and mins based on ratio
	 * 
	 * @api - private
	 * @param [integer] width
	 * @param [integer] height
	 * @return [object] size(width,height)
	 * 
	 */
	function _putInRangeImage (width, height){
		var self = this;
		var ratio = (width / height);
		var nwidth;
		var nheight;

		if (width > self._options.maxWidth){
			nwidth = self._options.maxWidth;
			nheight = ((1 / ratio) * nwidth);
			if (nheight <= self._options.maxHeight) {
				width = nwidth;
				height = nheight;
			}
		}

		if (height > self._options.maxHeight){
			nheight = self._options.maxHeight;
			nwidth = (ratio * nheight);
			width = nwidth;
			height = nheight;
		}
		if (width < self._options.minWidth){
			width = self._options.minWidth;
			height = ((1 / ratio) * width);
			if (height > self._options.maxHeight)
				height = self._options.maxHeight;
			if (height < self._options.minHeight)
				height = self._options.minHeight;
		}
		if (height < self._options.minHeight){
			height = self._options.minHeight;
			width = (ratio * height);
			if (width > self._options.maxWidth)
				width = self._options.maxWidth;
			if (width < self._options.minWidth)
				width = self._options.minWidth;
		}
		var size = {
			width: window.Math.round(width),
			height: window.Math.round(height)
		};
		return size;
	}
	//Cloning an object via http://jsperf.com/cloning-an-object/2
	function _cloneObject (obj) {
		var target = {};
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
			 target[i] = obj[i];
			}
		}
		return target;
	}
  
	// mediaWindow Which returns a MediaWindow Class
	var mediaWindow = function(){
		return new MediaWindow();
	};
	// mediaWindow prototype
	// mediaWindow.fn is public, so functions can be added to the mediaWindow class
	mediaWindow.fn = MediaWindow.prototype = {
		init: function (JSONurl, pageQuery) {
			_init.call(this, JSONurl, pageQuery);
			return this;
		},
		openWindow: function (id, callback) {
			_openWindow.call(this, id, callback);
			return this;
		},
		closeWindow: function (callback) {
			_closeWindow.call(this, true, callback);	
			return this;
		},
		nextItem: function (callback) {
			_nextItem.call(this, callback);
			return this;
		},
		prevItem: function () {
			_prevItem.call(this, callback);
			return this;
		},
		setOption: function (option, value) {
			this._options[option] = value;
			return this;
		}
	};
	
	mediaWindow.version = Version;

	window.mediaWindow = mediaWindow;

	return mediaWindow;

} )( this, this.document );