$(function() {
	
	var buildFilmCover = function(key, val, pid, name, info) {
		if(val.critics_consensus)
			$('.film-shelf').find('.film-' + pid + ' .info').after('<p class="info">'+val.critics_consensus+'</p>');

		$('.film-shelf')
			.find('.film-' + pid)
				.append('<ul class="rating"><li><span class="barchart"><img src="img/bar.png" height="10" width="' + val.ratings.critics_score + '%" /></span><span>Critics rating: <b>'+val.ratings.critics_rating+ '</b></span></li></ul>')
				.removeClass('no-img')
				.prepend('<img src="'+val.posters.profile+'" alt="" />')
			.find('.rating')
				.append('<li><span class="barchart"><img src="img/bar.png" height="10" width="' + val.ratings.audience_score + '%" /></span><span>Audience rating: <b>'+val.ratings.audience_rating+ '</b></span></li>').end()
			.find('h2')	
				.append(' <span>('+val.year+')</span>');

		if(val.alternate_ids) {
			$('.film-shelf').find('.film-' + pid + ' .info:last')
				.after('<p class="info"><a href="http://www.imdb.com/title/tt'+val.alternate_ids.imdb+'">Read more about <i>\''+name+'\'</i> on IMDb</a></p>');
		}
	};
	
	var getFilmDetails = function(name, pid) {
		//console.log('getting film: '+ name);
		$.ajax({
			url: "http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=" + rottenTomsKey + "&q="+name,
			dataType: "jsonp",
			success: function(data) {
				var info = '';
				var done = false;
				$.each(data.movies, function(key, val) {
					if(val.title == name && !done) {
						buildFilmCover(key, val, pid, name, info);
						done = true;
					}
				});
			},
			error: function() {
				$('.film-shelf').find('.film-' + pid).append('<p>Couldn\'t find the film info</p>');
			}
		});
	};	
	
	var outputFilms = function(data, type) {
		if(data.length == 0) {
			$('div[role=main]').append('<p class="film-shelf">No films</p>');
		}
		else {
			var filmShelf = $('<ul class="film-shelf" />');
			var listOfIds = [];
			
			$.each(data, function(key, val) {
				var filmTitle = val.programme.title;
				var uniqueId = val.programme.pid;
				var serviceId = 'iplayer';
				if(val.service) serviceId = val.service.id;

				//check id not already used
				var filmAlreadyRendered = $.inArray(uniqueId, listOfIds) != -1;

				if(!filmAlreadyRendered) {
					listOfIds.push(uniqueId);
					filmShelf.append('<li class="film-' + uniqueId + ' ' + serviceId + ' no-img"></li>');
					var film = filmShelf.find('.film-' + uniqueId);
					film.append('<h2><a href="http://bbc.co.uk/programmes/'+val.programme.pid+'">' + val.programme.title + '</a></h2>');
					var filmHeader = filmShelf.find('.film-' + uniqueId + ' h2');

					if(val.start)
						filmHeader.after('<time>' + $.format.date(val.start, "dd MMM yyyy") + ' (' + $.format.date(val.start, "HH:mm") + ')</time>');
					else
						filmHeader.after('<time><a href="http://bbc.co.uk/programmes/' + val.programme.pid + '"><b>Watch now</b></a> (' + val.programme.media.availability + ')</time>');

					film.append('<p class="info">' + val.programme.short_synopsis + '</p>');

					if(serviceId != 'bbc_hd') {
						getFilmDetails(filmTitle, uniqueId);
					}
					else {
						// get bbc hd film info
						$.getJSON("http://www.bbc.co.uk/programmes/"+uniqueId+".json", function(data) {
							var synopsis;
							if(data.programme.long_synopsis) synopsis = data.programme.long_synopsis;
							else if(data.programme.medium_synopsis) synopsis = data.programme.medium_synopsis;
							else if(data.programme.short_synopsis) synopsis = data.programme.short_synopsis;
							film
								.append('<p class="info">' + synopsis + '</p>')
								.prepend('<img src="http://www.bbc.co.uk/iplayer/images/episode/' + uniqueId + '_640_360.jpg" alt="" width="210px" />');
						});
					}
				}
				else {
					// just add in the new time
					if(val.start) {
						filmShelf.find('.film-' + uniqueId + ' time:last')
							.after('<time>' + $.format.date(val.start, "dd MMM yyyy") + ' (' + $.format.date(val.start, "HH:mm") + ')</time>');
					}
				}
			});
			$('div[role=main]').append(filmShelf);
		}
	};
	
	var getData = function(url, type) {
		var filmData = localStorage.getItem(selection);
		
		if(!filmData) {
			$.getJSON(url, function(data) {
				filmData = data.broadcasts;
				if(type == 'episodes') filmData = data.episodes;
				outputFilms(filmData);
				localStorage.setItem(selection, JSON.stringify(filmData));
			});			
		}
		else {
			outputFilms($.parseJSON(filmData));
		}
	};

	var selection = $('header option:selected').val();
	
	$('header select').change(function() {
		var selected = $(this).find('option:selected');
		selection = selected.val();

		$('.film-shelf').remove();
		switch(selection) {
			case 'now':
				$('h1').text('BBC films on iPlayer');
				getData('http://www.bbc.co.uk/programmes/formats/films/player/episodes.json', 'episodes');
				break;
			case 'today':
				$('h1').text('BBC films today');
				getData('http://www.bbc.co.uk/tv/programmes/formats/films/schedules/today.json', 'broadcasts');
				break;
			case 'tomorrow':
				$('h1').text('BBC films tomorrow');
				getData('http://www.bbc.co.uk/tv/programmes/formats/films/schedules/tomorrow.json', 'broadcasts');
				break;
			default:
				$('h1').text('BBC films in the next seven days');
				selected.attr('selected', true);
				getData('http://www.bbc.co.uk/tv/programmes/formats/films/schedules/upcoming.json', 'broadcasts');
		}
	});
	
	$('header select').trigger('change');
	
	$('#clear').click(function() {
		localStorage.clear();
		alert('cleared');
	});
	
});